import { type PDFDocumentLoadingTask, getDocument, PDFWorker } from 'pdfjs-dist';
import { EventBus, PDFViewer, type PDFPageView } from 'pdfjs-dist/web/pdf_viewer';
import PdfJsWorker from 'pdfjs-dist/build/pdf.worker.min.js?worker';
import numberRange from 'lodash/range';
import intersection from 'lodash/intersection';
import { makeObservable, observable, when, action, runInAction, computed } from 'mobx';

import { AnnotationTypes, type HighlightAreaDTO, type HighlightDTO } from 'interface/material';
import type PdfEditor from 'model/material/PdfEditor';

import './style.css';
import { getValidEndContainer, isElement } from './domUtils';

interface Options {
  container: HTMLDivElement;
  viewer: HTMLDivElement;
  editor: PdfEditor;
  onTextSelected: () => void;
  onTextSelectCancel: () => void;
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
  readonly editor: PdfEditor;
  private loadingTask?: PDFDocumentLoadingTask;
  private readonly cancelLoadingBlob: ReturnType<typeof when>;

  @observable
  private renderedPages = new Set<number>();

  @observable
  readonly page = {
    current: 1,
    total: 1,
  };

  @observable
  scale: number | string = 'auto';

  constructor(private readonly options: Options) {
    makeObservable(this);
    this.pdfViewer = PdfViewer.createPDFViewer(options);
    this.editor = options.editor;
    this.cancelLoadingBlob = when(
      () => Boolean(options.editor.entity),
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      () => this.load(options.editor.entity!.blob),
    );

    this.pdfViewer.eventBus.on(
      'pagerender',
      action(({ pageNumber }: { pageNumber: number }) => {
        this.renderedPages.add(pageNumber);
      }),
    );

    this.pdfViewer.eventBus.on(
      'pagechanging',
      action(({ pageNumber }: { pageNumber: number }) => {
        this.page.current = pageNumber;
      }),
    );
  }

  @computed
  get visiblePages() {
    const redundancy = 2;

    return intersection(
      numberRange(
        Math.max(0, this.page.current - redundancy),
        Math.min(this.page.total, this.page.current + redundancy) + 1,
      ),
      Array.from(this.renderedPages),
    );
  }

  private static createPDFViewer(options: Options) {
    const pdfViewer = new PDFViewer({ ...options, eventBus: new EventBus() });
    // pdfViewer.scrollMode = ScrollMode.PAGE;

    return pdfViewer;
  }

  private async load(blob: ArrayBuffer) {
    if (this.loadingTask) {
      throw new Error('loaded');
    }

    const pdfWorker = new PDFWorker({ port: new PdfJsWorker() });
    this.loadingTask = getDocument({ data: blob.slice(0), worker: pdfWorker });

    const doc = await this.loadingTask.promise;
    this.pdfViewer.setDocument(doc);

    runInAction(() => {
      this.page.total = doc.numPages;
    });

    document.addEventListener('selectionchange', this.handleSelection);
  }

  private readonly handleSelection = () => {
    if (this.getSelectionRange()) {
      this.options.onTextSelected();
    } else {
      this.options.onTextSelectCancel();
    }
  };

  goToPage(page: number) {
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
    this.loadingTask?.destroy();
    this.cancelLoadingBlob();
    document.removeEventListener('selectionchange', this.handleSelection);
  }

  getState() {
    return {
      page: this.pdfViewer.currentPageNumber,
    };
  }

  @action.bound
  setScale(value: string | number) {
    const _value = value;
    const { currentScale } = this.pdfViewer;

    if (value === 'up') {
      this.scale = this.pdfViewer.currentScale = SCALE_STEPS.find((step) => step > currentScale) || currentScale;
    } else if (value === 'down') {
      this.scale = this.pdfViewer.currentScale = SCALE_STEPS.findLast((step) => step < currentScale) || currentScale;
    } else {
      this.scale = _value;
      this.pdfViewer.currentScaleValue = String(_value);
    }
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

  getSelectionRange() {
    const selection = window.getSelection();
    const viewerEl = this.pdfViewer.viewer;

    if (
      !selection ||
      selection.isCollapsed ||
      selection.rangeCount > 1 ||
      !viewerEl ||
      !viewerEl.contains(selection.anchorNode) ||
      !viewerEl.contains(selection.focusNode)
    ) {
      return null;
    }

    return {
      range: selection.getRangeAt(0),
      isEndAtStart: PdfViewer.isEndAtStart(selection),
    };
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
    const startPage = PdfViewer.getPageFromNode(range.startContainer);
    const endPage = PdfViewer.getPageFromNode(getValidEndContainer(range));
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

  private static isEndAtStart(selection: Selection) {
    const { focusNode, focusOffset, anchorNode, anchorOffset } = selection;

    if (focusNode === anchorNode) {
      return focusOffset < anchorOffset;
    }

    if (!anchorNode || !focusNode) {
      throw new Error('no anchorNode / focusNode');
    }

    return Boolean(anchorNode.compareDocumentPosition(focusNode) & Node.DOCUMENT_POSITION_PRECEDING);
  }

  private static getTextFromRange(range: Range) {
    return Array.from(range.cloneContents().childNodes)
      .map((el) => el.textContent)
      .join('');
  }

  private static getPageFromNode(node: Node | null) {
    let currentNode: Node | null = node;

    while (currentNode) {
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

  jumpToPage(page: number) {
    this.pdfViewer.currentPageNumber = page;
  }
}
