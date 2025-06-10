import { action, autorun, reaction } from 'mobx';
import { FindState, PDFFindController } from 'pdfjs-dist/web/pdf_viewer.mjs';
import assert from 'assert';

import EventBus from '#domain/client/shared/infra/EventBus';
import type PdfViewer from '../PDFViewer';
import type { MatchesCount } from '#domain/client/app/model/note/editor/PdfEditor/TextFinder';

export default class Searcher extends EventBus<{ matchUpdated: { pages: number[] } }> {
  constructor(private readonly pdfViewer: PdfViewer) {
    super('pdf-searcher');
    this.pdfViewer.eventBus.on('updatefindcontrolstate', this.handleUpdate);
    this.pdfViewer.eventBus.on('updatefindmatchescount', this.handleUpdate);
    this.pdfViewer.eventBus.on('updatetextlayermatches', this.emitMatchUpdated.bind(this));
    autorun(() => this.search({ type: '' }), { signal: this.destroyController.signal });

    reaction(
      () => this.textFinder.isEnabled,
      (isEnabled) => !isEnabled && this.close(),
      { signal: this.destroyController.signal },
    );
  }

  private readonly destroyController = new AbortController();

  public get textFinder() {
    return this.pdfViewer.editor.textFinder;
  }

  private emitMatchUpdated(e: { source: { pageMatches: number[][] } }) {
    if (e.source.pageMatches.length) {
      this.emit('matchUpdated', {
        pages: Object.keys(e.source.pageMatches)
          .filter((i) => e.source.pageMatches[Number(i)]?.length)
          .map(Number),
      });
    }
  }

  private handleUpdate = action((e: { matchesCount: MatchesCount; state?: number; source?: unknown }) => {
    if (
      e.state === undefined || // updatefindmatchescount 事件
      e.state === FindState.NOT_FOUND ||
      ((e.state === FindState.FOUND || e.state === FindState.WRAPPED) && this.textFinder.matchesCount) // updatefindcontrolstate 事件。该事件在初次触发时数据不准，后续的数据才准
    ) {
      const pageMatches = e.source instanceof PDFFindController ? e.source.pageMatches : undefined;
      const pageMatchesLength = e.source instanceof PDFFindController ? e.source.pageMatchesLength : undefined;

      this.textFinder.updateResult({ pageMatches, pageMatchesLength, matchesCount: e.matchesCount });
    }
  });

  private search(options: {
    type:
      | 'again' // 按回车键、上下跳匹配结果
      | ''; // 输入关键词，或者切换搜索选项
    findPrevious?: boolean;
  }) {
    if (!this.textFinder.isEnabled) {
      return;
    }

    this.pdfViewer.eventBus.dispatch('find', {
      ...options,
      ...this.textFinder.options,
      highlightAll: true, // 高亮所有匹配/只高亮当前的匹配
      matchDiacritics: false,
    });
  }

  public jumpTo(index: number) {
    assert(this.textFinder.matchesCount);
    let offset = index - (this.textFinder.matchesCount.current - 1) + 1;

    while (offset !== 0) {
      if (offset > 0) {
        this.next();
        offset -= 1;
      } else {
        this.previous();
        offset += 1;
      }
    }
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
    this.textFinder.destroy();
  }
}
