import { action, autorun, observable } from 'mobx';
import { FindState, PDFFindController } from 'pdfjs-dist/web/pdf_viewer.mjs';
import { compact } from 'lodash-es';

import { extractDigest } from '#utils/string';
import type PdfViewer from '../PDFViewer';

interface MatchesCount {
  current: number;
  total?: number;
}

export type Digest = NonNullable<ReturnType<typeof extractDigest>>;

export interface PageSearchResult {
  page: number;
  digests: Digest[];
}

export default class Searcher {
  constructor(private readonly pdfViewer: PdfViewer) {
    this.pdfViewer.eventBus.on('updatefindcontrolstate', this.handleUpdate.bind(this));
    this.pdfViewer.eventBus.on('updatefindmatchescount', this.handleUpdate.bind(this));
    autorun(() => this.search({ type: '' }), { signal: this.destroyController.signal });
  }

  private readonly destroyController = new AbortController();

  @observable public accessor isEnabled = false;

  @observable.ref public accessor searchResult: PageSearchResult[] | undefined;

  @observable public accessor options = {
    query: '',
    caseSensitive: false,
    entireWord: false,
  };

  @observable public accessor matchesCount: MatchesCount | undefined;

  @action
  private handleUpdate(e: { matchesCount: MatchesCount; state?: number; source?: unknown }) {
    if (!this.options.query) {
      this.matchesCount = undefined;
      this.searchResult = undefined;
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

      this.searchResult = pageMatches
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
    if (!this.isEnabled) {
      return;
    }

    this.pdfViewer.eventBus.dispatch('find', {
      ...options,
      ...this.options,
      highlightAll: true, // 高亮所有匹配/只高亮当前的匹配
      matchDiacritics: false,
    });
  }

  @action
  public toggle() {
    this.isEnabled = !this.isEnabled;

    if (!this.isEnabled) {
      this.close();
    }
  }

  @action
  public toggleOption(key: 'caseSensitive' | 'entireWord') {
    this.options[key] = !this.options[key];
  }

  public next() {
    this.search({ type: 'again' });
  }

  public previous() {
    this.search({ type: 'again', findPrevious: true });
  }

  private close() {
    this.pdfViewer.eventBus.dispatch('findbarclose', {});
  }

  public destroy() {
    this.close();
    this.destroyController.abort();
  }
}
