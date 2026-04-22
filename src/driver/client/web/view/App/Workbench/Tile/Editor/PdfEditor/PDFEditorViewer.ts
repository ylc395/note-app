import { action, reaction, when } from 'mobx';
import PDFViewer, { type Options } from '#web/infra/PDFViewer';
import type PdfEditor from '#domain/client/app/model/note/editor/PdfEditor';
import { clone, debounce } from 'lodash-es';

// 这是一个粘合 model（PDFEditor） 和 infra（PDFViewer）的类
export default class PDFEditorViewer {
  constructor(public readonly editor: PdfEditor) {}

  private readonly abortController = new AbortController();

  public readonly viewer = new PDFViewer();

  public async init(options: Pick<Options, 'container' | 'view'>) {
    try {
      await when(() => this.editor.isReady, { signal: this.abortController.signal });
    } catch (error) {
      if (error instanceof Error && error.message === 'WHEN_ABORTED') {
        return;
      }
    }

    reaction(() => this.viewer.visiblePages, this.editor.updateVisiblePages.bind(this.editor), {
      signal: this.abortController.signal,
    });

    await this.viewer.init(this.editor.doc!, {
      ...options,
      initialProgress: this.editor.progress,
      onProgressUpdated: this.updateProgress,
    });

    this.initTextFinder();
  }

  private readonly updateProgress: Options['onProgressUpdated'] = action(({ location: { pdfOpenParams } }) => {
    this.editor.progress = pdfOpenParams.replace(/^#/, '');
  });

  private initTextFinder() {
    if (this.abortController.signal.aborted) {
      return;
    }

    const fields = ['query', 'caseSensitive', 'entireWord'] as const;

    for (const field of fields) {
      // 把 model 上的查询条件同步到 infra 中
      reaction(
        () => this.editor.textFinder.options[field],
        (value) => this.viewer.textFinder.set(field, value),
        { signal: this.abortController.signal, fireImmediately: true },
      );
    }

    // 把 infra 上的结果同步到 model 中
    reaction(
      () => this.viewer.textFinder.result,
      (result) => result && this.editor.textFinder.updateResult(clone(result)), // 这里必须 clone 一下，避免修改同一个引用
      { signal: this.abortController.signal },
    );

    // 当 infra 查不到时，查远程
    reaction(
      () => this.viewer.textFinder.state,
      (state) => {
        if (state?.status === 'notFound') {
          this.editor.textFinder.searchByRemote({ currentPage: this.viewer.currentPage!, prev: state.previous });
        }
      },
      { signal: this.abortController.signal },
    );

    reaction(() => this.editor.textFinder.currentPage, this.handleCurrentPageChange, {
      signal: this.abortController.signal,
    });

    this.editor.textFinder.eventBus.on('next', this.viewer.textFinder.next, { signal: this.abortController.signal });
    this.editor.textFinder.eventBus.on('prev', this.viewer.textFinder.prev, { signal: this.abortController.signal });
    this.editor.textFinder.eventBus.on('jump', this.viewer.textFinder.jumpTo, { signal: this.abortController.signal });

    this.viewer.textFinder.init();

    /* 由于 pdfjs 的搜索功能完全不受控（例如会自动跳转到搜索结果），我们这里不再进行一次“初始搜索”
       这意味着重新切换到当前编辑器时，搜索结果会完全丢失。但我们也没有什么好的解决办法
    */
  }

  private readonly handleCurrentPageChange = debounce((page: number | null) => {
    if (
      page &&
      this.viewer.currentPage &&
      Math.abs(page - this.viewer.currentPage) > 1 // 允许 1 页的误差。pdfjs 原生的跳转功能在跳转时可能存在 1 页误差
    ) {
      this.viewer.jumpTo(page);
    }
  }, 300);

  public destroy() {
    this.abortController.abort();
    this.handleCurrentPageChange.cancel();
    this.editor.textFinder.clearResult(); // 这里清空下 model 中保存的搜索结果。因为 pdfjs 的搜索组件的数据已经全部丢失，无法恢复了
    this.viewer.destroy();
  }
}
