import { action, reaction } from 'mobx';
import { FindState, PDFFindController } from 'pdfjs-dist/web/pdf_viewer.mjs';
import assert from 'assert';

import type PdfViewer from '../PDFViewer';
import type { MatchesCount } from '#domain/client/app/model/note/editor/PdfEditor/TextFinder';

export default class TextFinder {
  constructor(private readonly pdfViewer: PdfViewer) {
    this.pdfViewer.eventBus.on('updatefindcontrolstate', this.handleUpdate); // 切换当前选中的搜索结果时会触发
    this.pdfViewer.eventBus.on('updatefindmatchescount', this.handleUpdate); // 更新搜索数量时会触发

    reaction(
      () => this.model.options,
      () => this.search({ type: '' }),
      { signal: this.destroyController.signal },
    );

    reaction(
      () => this.model.isEnabled,
      (isEnabled) => {
        if (!isEnabled) {
          this.close();
        }
      },
      { signal: this.destroyController.signal },
    );
  }

  private readonly destroyController = new AbortController();

  public get model() {
    return this.pdfViewer.editor.textFinder;
  }

  private handleUpdate = action((e: { matchesCount: MatchesCount; state?: number; source?: unknown }) => {
    if (
      !this.model.isEnabled ||
      e.state === FindState.PENDING ||
      (e.state === undefined && !this.model.result) // updatefindcontrolstate 事件的数据，只有在已存在搜索结果的情况下有意义
    ) {
      return;
    }

    const pageMatches = e.source instanceof PDFFindController ? e.source.pageMatches : undefined;
    const pageMatchesLength = e.source instanceof PDFFindController ? e.source.pageMatchesLength : undefined;

    this.model.updateResult({ pageMatches, pageMatchesLength, matchesCount: e.matchesCount });
  });

  private search(options: {
    type:
      | 'again' // 按回车键、上下跳匹配结果
      | ''; // 输入关键词，或者切换搜索选项
    findPrevious?: boolean;
  }) {
    if (!this.model.isEnabled || !this.model.options?.query) {
      return;
    }

    this.pdfViewer.eventBus.dispatch('find', {
      ...options,
      ...this.model.options,
      highlightAll: true, // 高亮所有匹配/只高亮当前的匹配
      matchDiacritics: false,
    });
  }

  public jumpTo(index: number) {
    assert(this.model.result);
    let offset = index - (this.model.result.current - 1) + 1;

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
    this.pdfViewer.eventBus.dispatch('findbarclose', {}); // finder 用了定时器之类的资源，必须通过这个事件去清除
  }

  public destroy() {
    this.close();
    this.destroyController.abort();
  }
}
