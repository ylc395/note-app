import { EventBus, PDFViewer, PDFLinkService, PDFPageView } from 'pdfjs-dist/web/pdf_viewer.mjs';
import { AnnotationEditorType, AnnotationMode } from 'pdfjs-dist';
import { debounce, memoize, range as numberRange } from 'lodash-es';
import { observable, when, action, computed } from 'mobx';
import assert from 'assert';

import type PdfEditor from '#domain/client/app/model/note/editor/PdfEditor';
import shell from '#web/infra/shell';

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
      () => Boolean(this.editor.doc),
      () => this.init(),
      { signal: this.destroyController.signal },
    );
  }

  @computed
  public get totalPage() {
    return this.editor.doc?.numPages || 0;
  }

  public getPageEl(page: number) {
    return (this.pdfViewer.getPageView(page - 1) as PDFPageView).div;
  }

  private createPDFViewer(options: Options) {
    const eventBus = new EventBus();
    const linkService = new PDFLinkService({ eventBus, ignoreDestinationZoom: true });
    const pdfViewer = new PDFViewer({
      ...options,
      annotationEditorMode: AnnotationEditorType.NONE, // disable build-in annotation editor
      annotationMode: AnnotationMode.ENABLE_STORAGE,
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

    const updateUIState = debounce(
      action(({ location }: { location: { pdfOpenParams: string } }) => {
        this.editor.uiState.hash = location.pdfOpenParams;
      }),
      500,
    );

    pdfViewer.eventBus.on('updateviewarea', updateUIState);

    // 把 pdf 视图的位置移动到上一次离开的地方
    pdfViewer.eventBus.on('pagesinit', () => {
      // onePageRendered 仅在 setDocument 后才存在
      pdfViewer.onePageRendered.then(
        action(() => {
          const hash = this.editor.uiState.hash
            ?.replace('zoom=null', 'zoom=100') // zoom 为 null 传到 setHash 里会报错
            .replace(/^#/, '');

          if (hash) {
            pdfViewer.linkService.setHash(hash);
            // 这里有个 pdfjs 的 bug：第一次 setHash 后，由于 viewer 元素的高度未完全展开（目标页附近的元素都未渲染出来），视图被滚动到的位置不太对。需要二次 setHash
            pdfViewer.eventBus.on('updateviewarea', function setHash() {
              pdfViewer.linkService.setHash(hash);
              pdfViewer.eventBus.off('updateviewarea', setHash);
            });
          }

          this.isReady = true;
        }),
      );
    });

    this.destroyController.signal.addEventListener('abort', () => {
      updateUIState.flush();
      pdfViewer.cleanup();
    });

    return pdfViewer;
  }

  private async init() {
    assert(this.editor.doc);
    this.pdfViewer.setDocument(this.editor.doc);
    (this.pdfViewer.linkService as PDFLinkService).setDocument(this.editor.doc);

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
  public jumpTo(page: number | unknown) {
    if (typeof page === 'number') {
      if (page >= 1 && page <= this.totalPage) {
        this.pdfViewer.currentPageNumber = page;
        return true;
      }

      return false;
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.pdfViewer.linkService.goToDestination(page as any);
      return true;
    }
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
}
