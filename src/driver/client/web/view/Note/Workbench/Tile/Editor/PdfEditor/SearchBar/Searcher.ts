import { action, autorun, observable } from 'mobx';
import { FindState, PDFFindController } from 'pdfjs-dist/web/pdf_viewer.mjs';
import { compact, pick } from 'lodash-es';

import EventBus from '#domain/client/shared/infra/EventBus';
import { extractDigest } from '#utils/string';
import type PdfViewer from '../PDFViewer';

interface MatchesCount {
  current: number;
  total: number;
}

export default class Searcher extends EventBus<{ matchUpdated: { pages: number[] } }> {
  constructor(private readonly pdfViewer: PdfViewer) {
    super('pdf-searcher');
    this.pdfViewer.eventBus.on('updatefindcontrolstate', this.handleUpdate.bind(this));
    this.pdfViewer.eventBus.on('updatefindmatchescount', this.handleUpdate.bind(this));
    this.pdfViewer.eventBus.on('updatetextlayermatches', this.emitMatchUpdated.bind(this));
    autorun(() => this.search({ type: '' }), { signal: this.destroyController.signal });
  }

  private readonly destroyController = new AbortController();

  public get options() {
    const { query, isEnabled, options } = this.pdfViewer.editor.textFinder;

    return {
      ...options.toObject(),
      query,
      isEnabled,
    };
  }

  @observable public accessor matchesCount: MatchesCount | undefined;

  private emitMatchUpdated(e: { source: { pageMatches: number[][] } }) {
    if (e.source.pageMatches.length) {
      this.emit('matchUpdated', {
        pages: Object.keys(e.source.pageMatches)
          .filter((i) => e.source.pageMatches[Number(i)]?.length)
          .map(Number),
      });
    }
  }

  @action
  private handleUpdate(e: { matchesCount: MatchesCount; state?: number; source?: unknown }) {
    if (!this.options.query) {
      this.matchesCount = undefined;
      this.pdfViewer.editor.textFinder.searchResult = undefined;
      return;
    }

    if (
      e.state === undefined || // updatefindmatchescount 事件
      e.state === FindState.NOT_FOUND ||
      ((e.state === FindState.FOUND || e.state === FindState.WRAPPED) && this.matchesCount) // updatefindcontrolstate 事件。该事件在初次触发时数据不准，后续的数据才准
    ) {
      this.matchesCount = e.matchesCount;

      if (!(e.source instanceof PDFFindController)) {
        return;
      }

      const source = e.source;
      const { pageMatches, pageMatchesLength } = source;
      const texts = this.pdfViewer.editor.texts;

      if (!pageMatches || !pageMatchesLength || !texts) {
        return;
      }

      this.pdfViewer.editor.textFinder.searchResult = pageMatches
        .map((matchOffsets: number[], pageIndex) => ({
          page: pageIndex + 1,
          digests: compact(
            matchOffsets.map((offset, index) =>
              extractDigest({
                fullText: texts[pageIndex + 1] || '',
                matchIndex: offset,
                maxLength: 100,
                prefixMaxLength: 30,
                matchLength: pageMatchesLength[pageIndex][index],
              }),
            ),
          ),
        }))
        .filter(({ digests }) => digests.length > 0);
    }
  }

  private search(options: {
    type:
      | 'again' // 按回车键、上下跳匹配结果
      | ''; // 输入关键词，或者切换搜索选项
    findPrevious?: boolean;
  }) {
    if (!this.options.isEnabled) {
      return;
    }

    this.pdfViewer.eventBus.dispatch('find', {
      ...options,
      ...pick(this.options, ['caseSensitive', 'entireWord', 'query']),
      highlightAll: true, // 高亮所有匹配/只高亮当前的匹配
      matchDiacritics: false,
    });
  }

  @action
  public toggle() {
    this.options.isEnabled = !this.options.isEnabled;

    if (!this.options.isEnabled) {
      this.close();
    }
  }

  @action
  public toggleOption(key: 'caseSensitive' | 'entireWord') {
    const options = this.pdfViewer.editor.textFinder.options;
    options.set(key, options.get(key));
  }

  public next() {
    this.search({ type: 'again' });
  }

  public previous() {
    this.search({ type: 'again', findPrevious: true });
  }

  private close() {
    this.pdfViewer.eventBus.dispatch('findbarclose', {}); // finder 用了定时器之类的资源，必须通过这个时间去清除
  }

  public destroy() {
    this.close();
    this.destroyController.abort();
  }
}
