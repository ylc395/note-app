import { container } from 'tsyringe';
import { type PDFDocumentLoadingTask, getDocument, PDFWorker } from 'pdfjs-dist';
import { EventBus, ScrollMode, PDFViewer } from 'pdfjs-dist/web/pdf_viewer';
import PdfJsWorker from 'pdfjs-dist/build/pdf.worker.min.js?worker';

import type { HighlightDTO, MaterialVO } from 'interface/material';
import { token as remoteToken } from 'infra/remote';

import './style.css';

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
    pdfViewer.scrollMode = ScrollMode.PAGE;

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
    if (this.getValidRange()) {
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

  async createMark({ color, page }: { color: string; page: number }) {
    const result = this.getValidRange();

    if (!result) {
      throw new Error('no valid range');
    }

    const { range } = result;

    await this.remote.post<HighlightDTO, never>(`/materials/${this.options.materialId}/highlights`, {
      color,
      content: PdfViewer.getTextFromRange(range),
      ranges: [],
    });

    window.getSelection()?.removeAllRanges();
  }

  createComment() {
    return;
  }

  getValidRange() {
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
}
