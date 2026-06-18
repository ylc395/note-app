import { action, reaction } from 'mobx';

import type { OutlineItem } from '#domain/client/app/model/Workbench/noteEditor/PdfEditor/OutlineList';

import type PDFEditorViewer from '../PDFEditorViewer';

// 简单粘合一下 editor model 上的 outline 和视图层 pdf viewer 上的一些状态
export default class Outline {
  constructor(public readonly pdfViewer: PDFEditorViewer) {
    if (this.pdfViewer.viewer.pagesPromise) {
      this.pdfViewer.viewer.pagesPromise.then(this.init.bind(this));
    } else {
      this.pdfViewer.viewer.eventBus.on('pagesloaded', this.init.bind(this), { signal: this.destroyController.abort });
    }
  }

  private stopAutoFocus?: () => void;

  public get model() {
    return this.pdfViewer.editor.outline;
  }

  private async init() {
    await this.pdfViewer.editor.outline.load();
    this.autoFocus();
  }

  private autoFocus() {
    this.stopAutoFocus = reaction(
      () => this.pdfViewer.viewer.currentPage,
      (page) => {
        if (typeof page === 'number') {
          this.pdfViewer.editor.outline.focus(page);
        }
      },
      { signal: this.destroyController.signal, fireImmediately: !this.stopAutoFocus },
    );
  }

  private readonly destroyController = new AbortController();

  @action
  public jumpTo(dest: OutlineItem) {
    // 这里需要手动维护下 focusedPath。自动维护的 focusedPath 总是去找同一页的最后一个 outline
    const focusedPath: OutlineItem['key'][] = [];
    let current: OutlineItem | undefined = dest;

    while (current) {
      focusedPath.push(current.key);
      current = current.parent;
    }

    this.pdfViewer.editor.outline.focusedPath = focusedPath;

    clearTimeout(this.timerId);
    this.stopAutoFocus?.();
    this.pdfViewer.viewer.jumpTo(
      Array.isArray(dest.dest)
        ? [...dest.dest.slice(0, -1), null] // 最后一位置为 null 表示不要进行缩放
        : dest.dest,
    );
    this.timerId = setTimeout(this.autoFocus.bind(this), 500); // 没有什么好办法来确定何时应当重新开启 autoFocus，用定时器凑合
  }

  private timerId?: ReturnType<typeof setTimeout>;

  public destroy() {
    clearTimeout(this.timerId);
    this.destroyController.abort();
  }
}
