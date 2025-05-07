import { render, createComponent } from 'solid-js/web';
import { EventBus, PDFViewer, PDFLinkService, PDFPageView } from 'pdfjs-dist/web/pdf_viewer.mjs';
import { AnnotationEditorType, AnnotationMode } from 'pdfjs-dist';
import { debounce, memoize, range as numberRange } from 'lodash-es';
import { observable, when, action, computed, autorun } from 'mobx';
import assert from 'assert';
import { processFragmentDirectives, removeMarks } from '#third-party/text-fragments-polyfill/text-fragment-utils';

import type { default as PdfEditor, OutlineItem } from '#domain/client/app/model/note/editor/PdfEditor';
import HistoryStack, { Direction, type HistoryRecord } from '#domain/client/app/model/base/HistoryStack';
import shell from '#web/infra/shell';
import type { PDFTextFragmentSelector } from '#domain/shared/model/annotation';
import { APP_NAME } from '#domain/shared/infra/constants';

import AnnotationMark from './AnnotationMark';
import Selection from './SelectionTooltip/Selection';

interface Options {
  container: HTMLDivElement;
  viewer: HTMLDivElement;
  editor: PdfEditor;
}

export enum ScaleValues {
  Auto = 'auto',
  PageWidth = 'page-width',
  PageFit = 'page-fit',
  PageActual = 'page-actual',
}

export const SCALE_STEPS = [
  ...numberRange(0, 11).map((i) => i / 10),
  ...numberRange(12, 30, 2).map((i) => i / 10),
] as const;

export default class PdfViewer {
  private readonly pdfViewer: PDFViewer;
  public readonly editor: PdfEditor;
  private readonly destroyController = new AbortController();

  /*
   * PDFLinkService 还能关联一个 PDFHistory 对象，其具有管理历史栈的功能。但它实际上在使用浏览器的 url 历史栈，这不是我们想要的
   * 因此我们自己实现一个历史栈进行管理
   *
   * 以下位置会被我们保存：
   * 1. 一进来时的位置
   * 2. 通过跳转操作离开前的位置
   * 3. 跳转来到的位置
   */
  public readonly historyStack = new HistoryStack({
    onPop: this.handleHistoryPop.bind(this),
  });

  public get viewerElement() {
    return this.pdfViewer.viewer;
  }

  public readonly selection = new Selection(this);

  @observable public accessor currentPage = 1;
  @observable public accessor scale = {
    value: 1,
    text: '100%',
  };
  @observable public accessor isReady = false;

  constructor(options: Options) {
    this.editor = options.editor;
    this.pdfViewer = this.createPDFViewer(options);
    when(
      () => Boolean(this.editor.doc && this.editor.uiState),
      () => this.init(),
      { signal: this.destroyController.signal },
    );
  }

  @computed
  public get totalPage() {
    return this.editor.doc?.numPages || 0;
  }

  private readonly updateUIState = debounce(
    action(({ location }: { location: { pdfOpenParams: string } }) => {
      assert(this.editor.uiState);
      this.editor.uiState.hash = PdfViewer.normalizeHash(location.pdfOpenParams);
    }),
    500,
  );

  private createPDFViewer(options: Options) {
    const eventBus = new EventBus();
    const linkService = new PDFLinkService({ eventBus, ignoreDestinationZoom: true });
    const pdfViewer = new PDFViewer({
      ...options,
      annotationMode: AnnotationMode.ENABLE_STORAGE,
      annotationEditorMode: AnnotationEditorType.DISABLE, // annotationEditor 是什么不太清楚，不过这个东西如果启用，会和我们 App 的拖拽功能起冲突。先给它禁用了
      eventBus,
      linkService,
    });

    linkService.setViewer(pdfViewer);

    pdfViewer.eventBus.on(
      'pagechanging',
      action(({ pageNumber }: { pageNumber: number }) => {
        this.currentPage = pageNumber;
      }),
    );

    pdfViewer.eventBus.on(
      'scalechanging',
      action((e: { scale: number; presetValue?: string }) => {
        this.scale.text = e.presetValue || `${e.scale * 100}%`;
        this.scale.value = e.scale;
      }),
    );

    // 把 pdf 视图的位置移动到上一次离开的地方
    pdfViewer.eventBus.on('pagesinit', () => {
      assert(this.editor.uiState);
      const hash = this.editor.uiState.hash;

      if (hash) {
        this.jumpTo({ hash });
      }

      // onePageRendered 仅在 setDocument 后才存在
      pdfViewer.onePageRendered.then(
        action(() => {
          pdfViewer.eventBus.on('updateviewarea', this.updateUIState);
          this.isReady = true;
        }),
      );
    });

    pdfViewer.eventBus.on('textlayerrendered', ({ pageNumber }: { pageNumber: 1 }) => {
      when(
        () => this.editor.annotation.status === 'ok',
        () => this.renderAnnotation(pageNumber),
        { signal: this.destroyController.signal },
      );
    });

    this.destroyController.signal.addEventListener(
      'abort',
      () => {
        this.updateUIState.flush();
        pdfViewer.cleanup();
      },
      { once: true },
    );

    return pdfViewer;
  }

  private pageAnnotationMarkMap: Record<number, { root: HTMLElement; dispose: Array<() => void> }> = {};

  public renderAnnotation(page: number) {
    assert(this.viewerElement);
    const MARK_CLASS_NAME = `${APP_NAME}-pdf-mark`;

    const pageAnnotationMark = this.pageAnnotationMarkMap[page];

    if (pageAnnotationMark) {
      for (const dispose of pageAnnotationMark.dispose) {
        this.destroyController.signal.removeEventListener('abort', dispose);
        dispose();
      }
      pageAnnotationMark.root.remove();
      delete this.pageAnnotationMarkMap[page];
    }

    removeMarks(
      Array.from(
        this.viewerElement.querySelectorAll(
          `.${MARK_CLASS_NAME}[data-start-page="${page}"], .${MARK_CLASS_NAME}[data-end-page="${page}"]`,
        ),
      ),
    );

    for (const annotation of this.editor.annotation.list) {
      const fragments = annotation.selectors.filter(
        (s) => s.type === 'PDFTextFragmentSelector' && (s.startPage === page || s.endPage === page),
      ) as PDFTextFragmentSelector[];

      for (const [i, fragment] of fragments.entries()) {
        const root =
          fragment.startPage === fragment.endPage
            ? (this.pdfViewer.getPageView(page - 1) as PDFPageView).textLayer?.div
            : this.viewerElement;

        assert(root);
        const { text } = processFragmentDirectives({ text: [fragment] }, document, root);

        for (const [j, mark] of text.entries()) {
          for (const [k, el] of mark.entries()) {
            (el as HTMLElement).style.backgroundColor = annotation.color;
            (el as HTMLElement).style.color = 'transparent';
            (el as HTMLElement).style.opacity = '0.4';
            (el as HTMLElement).dataset.startPage = String(fragment.startPage);
            (el as HTMLElement).dataset.endPage = String(fragment.endPage);
            (el as HTMLElement).classList.add(MARK_CLASS_NAME);

            // 给带评论的 mark 元素搭配一个图标。仅第一个 mark 元素会搭配这个图标
            if (annotation.body && i === 0 && j === 0 && k === mark.length - 1) {
              const markContainer = document.createElement('div');
              markContainer.classList.add('absolute', `${APP_NAME}-pdf-annotation-mark-container`);

              const dispose = render(
                () => createComponent(AnnotationMark, { annotation, markEl: el as HTMLElement }),
                markContainer,
              );

              if (!this.pageAnnotationMarkMap[page]) {
                this.pageAnnotationMarkMap[page] = { root: markContainer, dispose: [] };
              }

              this.pageAnnotationMarkMap[page].dispose.push(dispose);
              this.destroyController.signal.addEventListener('abort', dispose, { once: true });
              (this.pdfViewer.getPageView(page - 1) as PDFPageView).textLayer!.div.append(markContainer);
            }
          }
        }
      }
    }
  }

  private async init() {
    const doc = this.editor.doc;
    assert(doc);

    this.pdfViewer.setDocument(doc);
    (this.pdfViewer.linkService as PDFLinkService).setDocument(doc);

    this.pdfViewer.pagesPromise.then(() => {
      // 必须在这个 promise 里初始化大纲，否则拿不到对应的页数
      this.editor.outline.init(doc).then(() => {
        autorun(
          () => {
            if (this.editor.uiState?.['outline.type'] === 'text') {
              this.editor.outline.focus(this.currentPage);
            }
          },
          { signal: this.destroyController.signal },
        );
      });
    });

    this.hijackClick();
  }

  private hijackClick() {
    this.pdfViewer.viewer?.addEventListener('click', (e) => {
      if (e.target instanceof HTMLAnchorElement && e.target.href) {
        shell.openNewWindow(e.target.href);
        e.preventDefault();
      }
    });
  }

  @action
  public jumpTo(page: number | OutlineItem | { hash: string }, noHistory = false) {
    if (typeof page === 'number' && (page < 1 || page > this.totalPage)) {
      return false;
    }

    this.updateUIState.flush(); // 在跳转之前，把最新的 UI 状态给保存下

    if (typeof page === 'number') {
      this.pdfViewer.currentPageNumber = page;
    } else if (typeof page === 'object' && 'hash' in page) {
      this.pdfViewer.linkService.setHash(page.hash);
    } else if (page.dest) {
      this.editor.outline.focusedItemKey = page.key;
      this.pdfViewer.linkService.goToDestination(page.dest);
    }

    if (!noHistory) {
      assert(this.editor.uiState?.hash);
      // 记录跳转前的位置
      this.historyStack.push({ record: { key: this.editor.uiState.hash } });

      // 记录跳转后的位置
      this.pdfViewer.eventBus.on(
        'updateviewarea',
        ({ location }: { location: { pdfOpenParams: string } }) => {
          this.historyStack.push({ record: { key: PdfViewer.normalizeHash(location.pdfOpenParams) } });
        },
        { once: true },
      );
    }

    return true;
  }

  private handleHistoryPop(e: { record: HistoryRecord; direction: Direction }) {
    assert(this.editor.uiState?.hash);

    this.historyStack.push({ fromHistory: e.direction, record: { key: this.editor.uiState.hash } });
    this.historyStack.push({ fromHistory: e.direction, record: e.record });
    this.jumpTo({ hash: e.record.key }, true);
  }

  public readonly goToNextPage = () => {
    return this.pdfViewer.nextPage();
  };

  public readonly goToPreviousPage = () => {
    return this.pdfViewer.previousPage();
  };

  public destroy() {
    this.destroyController.abort();
  }

  public setScale(value: string) {
    const { currentScale } = this.pdfViewer;

    if (value === 'up') {
      this.pdfViewer.currentScale = SCALE_STEPS.find((step) => step > currentScale) || currentScale;
    } else if (value === 'down') {
      this.pdfViewer.currentScale = SCALE_STEPS.findLast((step) => step < currentScale) || currentScale;
    } else {
      this.pdfViewer.currentScaleValue = value;
    }
  }

  private readonly createPageCanvas = memoize(async (page: number) => {
    assert(this.pdfViewer.pdfDocument);
    const pageView = await this.pdfViewer.pdfDocument.getPage(page);
    const viewport = pageView.getViewport({ scale: 1 });
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const renderTask = pageView.render({
      annotationMode: AnnotationMode.DISABLE,
      viewport,
      canvasContext: canvas.getContext('2d')!,
    });
    await renderTask.promise;

    return canvas;
  });

  public async getViewrectDataUrl(
    page: number,
    viewrect: { left: number; top: number; width: number; height: number },
  ) {
    const pageCanvas = await this.createPageCanvas(page);
    const rectCanvas = document.createElement('canvas');

    rectCanvas.width = viewrect.width;
    rectCanvas.height = viewrect.height;

    rectCanvas
      .getContext('2d')!
      .drawImage(
        pageCanvas,
        viewrect.left,
        viewrect.top,
        viewrect.width,
        viewrect.height,
        0,
        0,
        viewrect.width,
        viewrect.height,
      );
    const dataUrl = rectCanvas.toDataURL();

    return dataUrl;
  }

  private static normalizeHash(hash: string) {
    return hash
      .replace('zoom=null', 'zoom=100') // zoom 为 null 传到 setHash 里会报错
      .replace(/^#/, '');
  }
}
