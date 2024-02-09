import { EventBus, PDFViewer, PDFLinkService, PDFPageView } from 'pdfjs-dist/web/pdf_viewer';
import { memoize, range as numberRange } from 'lodash-es';
import { makeObservable, observable, when, action, computed } from 'mobx';
import { container } from 'tsyringe';
import assert from 'assert';

import type PdfEditor from '@domain/app/model/material/editor/PdfEditor';
import { token as uiToken } from '@shared/domain/infra/ui';
import { AnnotationEditorType, AnnotationMode } from 'pdfjs-dist';
import AnnotationManager from './AnnotationManager';

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
  private readonly ui = container.resolve(uiToken);
  private readonly cancelLoadingDoc: ReturnType<typeof when>;
  public readonly annotationManager: AnnotationManager;

  @observable public currentPage = 1;
  @observable public scale = {
    value: 1,
    text: '100%',
  };
  @observable public isReady = false;

  constructor(options: Options) {
    makeObservable(this);

    this.editor = options.editor;
    this.pdfViewer = this.createPDFViewer(options);
    this.annotationManager = new AnnotationManager(this.pdfViewer, this.editor);
    this.cancelLoadingDoc = when(
      () => Boolean(this.editor.doc),
      () => this.init(),
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
    const linkService = new PDFLinkService({ eventBus });
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

    pdfViewer.eventBus.on(
      'updateviewarea',
      action(({ location }: { location: { pdfOpenParams: string } }) => {
        this.editor.updateUIState({ hash: location.pdfOpenParams });
      }),
    );

    return pdfViewer;
  }

  private async init() {
    assert(this.editor.doc);

    const { doc } = this.editor;

    this.pdfViewer.setDocument(doc);
    (this.pdfViewer.linkService as PDFLinkService).setDocument(doc);

    this.pdfViewer.onePageRendered.then(
      action(() => {
        this.isReady = true;
      }),
    );

    this.pdfViewer.firstPagePromise.then(() => {
      const hash = this.editor.uiState?.hash;
      if (hash) {
        const normalizedScaleValue =
          parseFloat(this.pdfViewer.currentScaleValue) === this.pdfViewer.currentScale
            ? Math.round(this.pdfViewer.currentScale * 10000) / 100
            : this.pdfViewer.currentScaleValue || 100;

        this.pdfViewer.linkService.setHash(hash.replace('zoom=null', `zoom=${normalizedScaleValue}`).replace(/^#/, ''));
      }
    });

    this.annotationManager.init();
    this.hijackClick();
  }

  private hijackClick() {
    this.pdfViewer.viewer?.addEventListener('click', (e) => {
      if (e.target instanceof HTMLAnchorElement && e.target.href) {
        this.ui.openNewWindow(e.target.href);
        e.preventDefault();
      }
    });
  }

  @action
  public jumpTo(page: number | unknown) {
    if (typeof page === 'number') {
      if (page >= 1 && page <= this.totalPage) {
        this.pdfViewer.currentPageNumber = page;
      }
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.pdfViewer.linkService.goToDestination(page as any);
    }
  }

  public readonly goToNextPage = () => {
    return this.pdfViewer.nextPage();
  };

  public readonly goToPreviousPage = () => {
    return this.pdfViewer.previousPage();
  };

  public destroy() {
    this.cancelLoadingDoc();
    this.annotationManager.destroy();
    this.pdfViewer.cleanup();
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
