import { EventBus, PDFViewer, type PDFPageView, PDFLinkService } from 'pdfjs-dist/web/pdf_viewer';
import numberRange from 'lodash/range';
import intersection from 'lodash/intersection';
import union from 'lodash/union';
import { makeObservable, observable, when, action, runInAction, computed, autorun } from 'mobx';

import { AnnotationTypes, type AnnotationVO, type Rect } from 'interface/material';
import type PdfEditorView from 'model/material/view/PdfEditorView';

import { isElement } from '../../common/domUtils';
import RangeSelector, { type RangeSelectEvent } from '../../common/RangeSelector';

interface Options {
  container: HTMLDivElement;
  viewer: HTMLDivElement;
  editorView: PdfEditorView;
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
  readonly editorView: PdfEditorView;
  private readonly cancelLoadingDoc: ReturnType<typeof when>;
  private readonly rangeSelector: RangeSelector;

  private autoSaveState?: ReturnType<typeof autorun>;

  @observable.ref selection: RangeSelectEvent | null = null;

  @observable.struct private visiblePages: number[] = [];

  @observable
  readonly page = { current: 1, total: 1 };
  @observable scale: number | string = 'auto';

  @observable status: 'loading' | 'loaded' = 'loading';

  protected get rootEl() {
    return this.pdfViewer.viewer as HTMLElement | null;
  }

  constructor(options: Options) {
    makeObservable(this);

    this.rangeSelector = new RangeSelector({
      rootEl: options.viewer,
      onTextSelectionChanged: action((e) => (this.selection = e)),
    });

    this.editorView = options.editorView;

    this.pdfViewer = this.createPDFViewer(options);
    this.cancelLoadingDoc = when(
      () => Boolean(this.editorView.editor.entity),
      () => this.init(),
    );
  }

  @computed
  get pagesWithAnnotation() {
    return intersection(
      this.visiblePages,
      union(
        Object.keys(this.editorView.editor.areaAnnotationsByPage).map(Number),
        Object.keys(this.editorView.editor.fragmentsByPage).map(Number),
      ),
    );
  }

  private createPDFViewer(options: Options) {
    const eventBus = new EventBus();
    const linkService = new PDFLinkService({ eventBus });
    const pdfViewer = new PDFViewer({ ...options, eventBus, linkService });
    // pdfViewer.scrollMode = ScrollMode.PAGE;

    linkService.setViewer(pdfViewer);

    pdfViewer.eventBus.on(
      'pagechanging',
      action(({ pageNumber }: { pageNumber: number }) => {
        this.page.current = pageNumber;
      }),
    );

    pdfViewer.eventBus.on(
      'scalechanging',
      action(({ scale }: { scale: number }) => {
        this.scale = scale;
      }),
    );

    return pdfViewer;
  }

  private async init() {
    if (!this.editorView.editor.entity) {
      throw new Error('not ready');
    }

    const { doc } = this.editorView.editor.entity;
    this.pdfViewer.setDocument(doc);
    (this.pdfViewer.linkService as PDFLinkService).setDocument(doc);

    this.pdfViewer.onePageRendered.then(
      action(() => {
        this.status = 'loaded';
      }),
    );

    runInAction(() => {
      this.page.total = doc.numPages;
    });

    const isFromState = await this.initFromState();

    this.pdfViewer.eventBus.on(
      'updateviewarea',
      action(({ location }: { location: { pdfOpenParams: string } }) => {
        this.editorView.updateState({ hash: location.pdfOpenParams });
        this.updateVisiblePages();
      }),
    );

    if (!isFromState) {
      this.updateVisiblePages();
    }
  }

  @action
  private readonly updateVisiblePages = () => {
    const { ids } = this.pdfViewer._getVisiblePages() as { ids: Set<number> };
    this.visiblePages = Array.from(ids);
  };

  private async initFromState() {
    const { hash } = this.editorView.state;

    await this.pdfViewer.firstPagePromise;

    if (hash) {
      const normalizedScaleValue =
        parseFloat(this.pdfViewer.currentScaleValue) === this.pdfViewer.currentScale
          ? Math.round(this.pdfViewer.currentScale * 10000) / 100
          : this.pdfViewer.currentScaleValue || 100;

      this.pdfViewer.linkService.setHash(hash.replace('zoom=null', `zoom=${normalizedScaleValue}`).replace(/^#/, ''));
      return true;
    }

    return false;
  }

  @action
  jumpTo(page: number | unknown) {
    if (typeof page === 'number') {
      this.pdfViewer.currentPageNumber = page;
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.pdfViewer.linkService.goToDestination(page as any);
    }
  }

  goToNextPage() {
    return this.pdfViewer.nextPage();
  }

  goToPreviousPage() {
    return this.pdfViewer.previousPage();
  }

  destroy() {
    this.pdfViewer.cleanup();
    this.cancelLoadingDoc();
    this.rangeSelector.destroy();
    this.autoSaveState?.();
  }

  setScale(value: string | number) {
    const _value = value;
    const { currentScale } = this.pdfViewer;

    if (value === 'up') {
      this.pdfViewer.currentScale = SCALE_STEPS.find((step) => step > currentScale) || currentScale;
    } else if (value === 'down') {
      this.pdfViewer.currentScale = SCALE_STEPS.findLast((step) => step < currentScale) || currentScale;
    } else {
      this.pdfViewer.currentScaleValue = String(_value);
    }
  }

  async createRangeAnnotation(color: string) {
    const range = this.selection?.range;

    if (!range) {
      throw new Error('no range');
    }

    await this.editorView.editor.createAnnotation({
      type: AnnotationTypes.PdfRange,
      color,
      content: RangeSelector.getTextFromRange(range),
      fragments: this.getFragments(range),
    });

    window.getSelection()?.removeAllRanges();
  }

  async createAreaAnnotation(page: number, rect: Rect) {
    const sourceCanvas = this.getCanvasEl(page);
    const { width: canvasDisplayWidth, height: canvasDisplayHeight } = sourceCanvas.getBoundingClientRect();

    const canvasVerticalRatio = canvasDisplayHeight / sourceCanvas.height;
    const canvasHorizontalRatio = canvasDisplayWidth / sourceCanvas.width;

    const canvas = document.createElement('canvas');
    const { verticalRatio, horizontalRatio } = this.getPageRatio(page);

    canvas.width = rect.width / canvasHorizontalRatio;
    canvas.height = rect.height / canvasVerticalRatio;

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(
      sourceCanvas,
      rect.x / canvasHorizontalRatio,
      rect.y / canvasVerticalRatio,
      canvas.width,
      canvas.height,
      0,
      0,
      canvas.width,
      canvas.height,
    );

    const snapshot = canvas.toDataURL('image/png');

    await this.editorView.editor.createAnnotation({
      color: 'yellow',
      type: AnnotationTypes.PdfArea,
      rect: {
        x: rect.x / horizontalRatio,
        y: rect.y / verticalRatio,
        width: rect.width / horizontalRatio,
        height: rect.height / verticalRatio,
      },
      page,
      snapshot,
    });
  }

  getPageRatio(page: number) {
    const { width: displayWith, height: displayHeight } = this.getSize(page);

    this.scale; // reade reactive scale to make this function depends on scale

    const {
      viewport: { rawDims },
    } = this.pdfViewer.getPageView(page - 1) as PDFPageView;
    const horizontalRatio = displayWith / (rawDims as { pageWidth: number }).pageWidth;
    const verticalRatio = displayHeight / (rawDims as { pageHeight: number }).pageHeight;

    return { horizontalRatio, verticalRatio };
  }

  private getFragments(range: Range) {
    const startPage = this.getPageFromNode(range.startContainer);
    const endPage = this.getPageFromNode(RangeSelector.getValidEndContainer(range));
    const pages = numberRange(startPage, endPage + 1).map((i) => {
      const pageEl = this.getPageEl(i);

      if (!pageEl) {
        throw new Error('no pageEl');
      }

      return { el: pageEl, number: i };
    });

    let i = 0;
    let j = 0;
    const fragments: { page: number; rect: Rect }[] = [];
    const pageWidth = pages[0]?.el.clientWidth;

    if (!pageWidth) {
      throw new Error('no page width');
    }

    const rects = Array.from(range.getClientRects()).filter(
      ({ width, height }) => width > 0 && height > 0 && width !== pageWidth,
    );

    while (rects[i]) {
      const page = pages[j];

      if (!page) {
        throw new Error('no page');
      }

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      if (PdfViewer.isIn(rects[i]!, page.el)) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const { x, y, width, height } = rects[i]!;
        const canvas = this.getCanvasEl(page.number);
        const { x: pageX, y: pageY } = canvas.getBoundingClientRect();
        const { horizontalRatio, verticalRatio } = this.getPageRatio(page.number);

        // todo: optimize
        // see https://github.com/agentcooper/react-pdf-highlighter/blob/c87474eb7dc61900a6cd1db5f82a1f7f35b7922c/src/lib/optimize-client-rects.ts
        fragments.push({
          page: page.number,
          rect: {
            x: (x - pageX) / horizontalRatio,
            y: (y - pageY) / verticalRatio,
            width: width / horizontalRatio,
            height: height / verticalRatio,
          },
        });
        i++;
      } else {
        j++;
      }
    }

    return fragments;
  }

  private getPageFromNode(node: Node | null) {
    let currentNode: Node | null = node;

    while (currentNode && currentNode !== this.rootEl) {
      if (isElement(currentNode) && currentNode.dataset.pageNumber) {
        return Number(currentNode.dataset.pageNumber);
      }

      currentNode = currentNode.parentElement;
    }

    throw new Error('no page');
  }

  private static isIn(rect: DOMRect, el: HTMLElement) {
    const elRect = el.getBoundingClientRect();

    return (
      rect.top >= elRect.top && rect.bottom <= elRect.bottom && rect.left >= elRect.left && rect.right <= rect.right
    );
  }

  getPageEl(page: number) {
    return (this.pdfViewer.getPageView(page - 1) as PDFPageView | undefined)?.div;
  }

  private getCanvasEl(page: number) {
    const el = (this.pdfViewer.getPageView(page - 1) as PDFPageView | undefined)?.canvas;

    if (!el) {
      throw new Error('no canvas el');
    }

    return el;
  }

  getSize(page: number) {
    const { height, width } = this.pdfViewer.getPageView(page - 1) as PDFPageView;

    return { height, width };
  }

  annotationTooltipRoot?: HTMLElement;
  readonly referenceElMap: Record<AnnotationVO['id'], HTMLElement> = {};

  @computed
  get currentAnnotationElement() {
    return this.editorView.currentAnnotationId ? this.referenceElMap[this.editorView.currentAnnotationId] : null;
  }
}
