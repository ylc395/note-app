import { EventBus, PDFViewer, type PDFPageView } from 'pdfjs-dist/web/pdf_viewer';
import numberRange from 'lodash/range';
import intersection from 'lodash/intersection';
import union from 'lodash/union';
import { makeObservable, observable, when, action, runInAction, computed } from 'mobx';

import { AnnotationTypes, type HighlightAreaDTO, type HighlightDTO } from 'interface/material';
import type PdfEditor from 'model/material/PdfEditor';

import { isElement } from '../../common/domUtils';
import RangeSelectable, { type Options as CommonOptions } from '../../common/RangeSelectable';

interface Options extends CommonOptions {
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

export default class PdfViewer extends RangeSelectable {
  private readonly pdfViewer: PDFViewer;
  readonly editor: PdfEditor;
  private readonly cancelLoadingDoc: ReturnType<typeof when>;

  @observable.ref
  private visiblePages: number[] = [];

  @observable
  readonly page = {
    current: 1,
    total: 1,
  };

  @observable
  scale: number | string = 'auto';

  protected get rootEl() {
    return this.pdfViewer.viewer as HTMLElement | null;
  }

  constructor(options: Options) {
    super(options);
    makeObservable(this);

    this.pdfViewer = PdfViewer.createPDFViewer(options);
    this.editor = options.editor;
    this.cancelLoadingDoc = when(
      () => Boolean(this.editor.entity),
      () => this.init(),
    );

    this.pdfViewer.eventBus.on(
      'pagechanging',
      action(({ pageNumber }: { pageNumber: number }) => {
        this.page.current = pageNumber;
      }),
    );

    this.pdfViewer.eventBus.on(
      'updateviewarea', // frequent event but we don't debounce this to ensure UE
      action(() => {
        const { ids } = this.pdfViewer._getVisiblePages() as { ids: Set<number> };
        this.visiblePages = Array.from(ids);
      }),
    );
  }

  @computed
  get annotationPages() {
    return intersection(
      this.visiblePages,
      union(
        Object.keys(this.editor.highlightAreasByPage).map(Number),
        Object.keys(this.editor.highlightFragmentsByPage).map(Number),
      ),
    );
  }

  private static createPDFViewer(options: Options) {
    const eventBus = new EventBus();
    const pdfViewer = new PDFViewer({ ...options, eventBus });
    // pdfViewer.scrollMode = ScrollMode.PAGE;

    return pdfViewer;
  }

  private async init() {
    if (!this.editor.entity) {
      throw new Error('not ready');
    }

    const { doc } = this.editor.entity;
    this.pdfViewer.setDocument(doc);

    runInAction(() => {
      this.page.total = doc.numPages;
    });
  }

  @action
  jumpToPage(page: number) {
    this.pdfViewer.currentPageNumber = page;
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
    super.destroy();
  }

  private doAfterCleaning(cb: () => void) {
    // wait annotationLayers to be cleared by react
    // or react will process un-existing annotationLayers (emptied by pdf.js) and throw error finally
    this.visiblePages = [];

    setTimeout(cb, 200);
  }

  setScale(value: string | number) {
    const _value = value;
    const { currentScale } = this.pdfViewer;

    this.doAfterCleaning(
      action(() => {
        if (value === 'up') {
          this.scale = this.pdfViewer.currentScale = SCALE_STEPS.find((step) => step > currentScale) || currentScale;
        } else if (value === 'down') {
          this.scale = this.pdfViewer.currentScale =
            SCALE_STEPS.findLast((step) => step < currentScale) || currentScale;
        } else {
          this.scale = _value;
          this.pdfViewer.currentScaleValue = String(_value);
        }
      }),
    );
  }

  async createHighlight(color: string) {
    const result = this.getSelectionRange();

    if (!result) {
      throw new Error('no valid range');
    }

    const { range } = result;

    await this.editor.createAnnotation({
      type: AnnotationTypes.Highlight,
      annotation: {
        color,
        content: PdfViewer.getTextFromRange(range),
        fragments: this.getFragments(range),
      },
    });

    window.getSelection()?.removeAllRanges();
  }

  async createHighlightArea(page: number, rect: HighlightAreaDTO['rect']) {
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

    await this.editor.createAnnotation({
      type: AnnotationTypes.HighlightArea,
      annotation: {
        rect: {
          x: rect.x / horizontalRatio,
          y: rect.y / verticalRatio,
          width: rect.width / horizontalRatio,
          height: rect.height / verticalRatio,
        },
        page,
        snapshot,
      },
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
    const endPage = this.getPageFromNode(RangeSelectable.getValidEndContainer(range));
    const pages = numberRange(startPage, endPage + 1).map((i) => {
      const pageEl = this.getPageEl(i);

      if (!pageEl) {
        throw new Error('no pageEl');
      }

      return { el: pageEl, number: i };
    });

    let i = 0;
    let j = 0;
    const fragments: HighlightDTO['fragments'] = [];
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
}
