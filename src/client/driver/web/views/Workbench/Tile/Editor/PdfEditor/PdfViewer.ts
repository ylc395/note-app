import { EventBus, PDFViewer, type PDFPageView, PDFLinkService } from 'pdfjs-dist/web/pdf_viewer';
import { range as numberRange } from 'lodash-es';
import { makeObservable, observable, when, action, computed } from 'mobx';
import assert from 'assert';

import type PdfEditor from '@domain/app/model/material/editor/PdfEditor';

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
  private readonly editor: PdfEditor;
  private readonly cancelLoadingDoc: ReturnType<typeof when>;

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
    this.cancelLoadingDoc = when(
      () => Boolean(this.editor.doc),
      () => this.init(),
    );
  }

  @computed
  public get totalPage() {
    return this.editor.doc?.numPages || 0;
  }

  private createPDFViewer(options: Options) {
    const eventBus = new EventBus();
    const linkService = new PDFLinkService({ eventBus });
    const pdfViewer = new PDFViewer({
      ...options,
      eventBus,
      linkService,
    });
    // pdfViewer.scrollMode = ScrollMode.PAGE;

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

    const hash = this.editor.uiState?.hash;
    await this.pdfViewer.firstPagePromise;

    if (hash) {
      const normalizedScaleValue =
        parseFloat(this.pdfViewer.currentScaleValue) === this.pdfViewer.currentScale
          ? Math.round(this.pdfViewer.currentScale * 10000) / 100
          : this.pdfViewer.currentScaleValue || 100;

      this.pdfViewer.linkService.setHash(hash.replace('zoom=null', `zoom=${normalizedScaleValue}`).replace(/^#/, ''));
    }
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
    this.pdfViewer.cleanup();
    this.cancelLoadingDoc();
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

  getPageRatio(page: number) {
    const { width: displayWith, height: displayHeight } = this.getSize(page);

    // this.scale; // reade reactive scale to make this function depends on scale

    const {
      viewport: { rawDims },
    } = this.pdfViewer.getPageView(page - 1) as PDFPageView;
    const horizontalRatio = displayWith / (rawDims as { pageWidth: number }).pageWidth;
    const verticalRatio = displayHeight / (rawDims as { pageHeight: number }).pageHeight;

    return { horizontalRatio, verticalRatio };
  }

  getSize(page: number) {
    const { height, width } = this.pdfViewer.getPageView(page - 1) as PDFPageView;

    return { height, width };
  }

  public static is(v: unknown): v is PdfViewer {
    return v instanceof PdfViewer;
  }
}
