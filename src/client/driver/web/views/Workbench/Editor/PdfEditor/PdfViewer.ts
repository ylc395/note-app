import { container } from 'tsyringe';
import { type PDFDocumentLoadingTask, getDocument, PDFWorker } from 'pdfjs-dist';
import { EventBus, ScrollMode, PDFViewer } from 'pdfjs-dist/web/pdf_viewer';
import PdfJsWorker from 'pdfjs-dist/build/pdf.worker.min.js?worker';
import numberRange from 'lodash/range';

import type { HighlightDTO, MaterialVO } from 'interface/material';
import { token as remoteToken } from 'infra/remote';

import './style.css';
import { getValidEndContainer, isElement } from './domUtils';

interface Options {
  container: HTMLDivElement;
  viewer: HTMLDivElement;
  materialId: MaterialVO['id'];
  onTextSelected: () => void;
  onTextSelectCancel: () => void;
}

export default class PdfViewer {
  private readonly pdfViewer: PDFViewer;
  private readonly remote = container.resolve(remoteToken);
  private loadingTask?: PDFDocumentLoadingTask;

  constructor(private readonly options: Options) {
    this.pdfViewer = PdfViewer.createPDFViewer(options);
  }

  private static createPDFViewer(options: Options) {
    const pdfViewer = new PDFViewer({ ...options, eventBus: new EventBus() });
    // pdfViewer.scrollMode = ScrollMode.PAGE;

    return pdfViewer;
  }

  async load(blob: ArrayBuffer) {
    if (this.loadingTask) {
      throw new Error('loaded');
    }

    const pdfWorker = new PDFWorker({ port: new PdfJsWorker() });
    this.loadingTask = getDocument({ data: blob, worker: pdfWorker });

    const doc = await this.loadingTask.promise;
    this.pdfViewer.setDocument(doc);

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
    document.removeEventListener('selectionchange', this.handleSelection);
  }

  getState() {
    return {
      page: this.pdfViewer.currentPageNumber,
    };
  }

  setScale(value: string) {
    this.pdfViewer.currentScaleValue = value;
  }

  async createMark(color: string) {
    const result = this.getSelectionRange();

    if (!result) {
      throw new Error('no valid range');
    }

    const { range } = result;

    await this.remote.post<HighlightDTO, unknown>(`/materials/${this.options.materialId}/highlights`, {
      color,
      content: PdfViewer.getTextFromRange(range),
      fragments: this.getFragments(range),
    });

    window.getSelection()?.removeAllRanges();
  }

  createComment() {
    return;
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

  private getFragments(range: Range) {
    const startPage = PdfViewer.getPageFromNode(range.startContainer);
    const endPage = PdfViewer.getPageFromNode(getValidEndContainer(range));
    const pages = numberRange(startPage, endPage + 1).map((i) => {
      const pageEl = this.pdfViewer.viewer?.querySelector(`.page[data-page-number="${i}"]`);

      if (!pageEl) {
        throw new Error('no pageEl');
      }

      return {
        el: pageEl as HTMLElement,
        number: i,
      };
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
        const { x: pageX, y: pageY } = page.el.getBoundingClientRect();

        // todo: optimize
        // see https://github.com/agentcooper/react-pdf-highlighter/blob/c87474eb7dc61900a6cd1db5f82a1f7f35b7922c/src/lib/optimize-client-rects.ts
        // todo: handle scale
        fragments.push({
          page: page.number,
          rect: { x: x - pageX, y: y - pageY, width, height },
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
}
