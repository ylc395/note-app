import { container } from 'tsyringe';
import { type PDFDocumentLoadingTask, getDocument, PDFWorker } from 'pdfjs-dist';
import { EventBus, ScrollMode, PDFViewer } from 'pdfjs-dist/web/pdf_viewer';
import PdfJsWorker from 'pdfjs-dist/build/pdf.worker.min.js?worker';

import type { MaterialVO } from 'interface/material';
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
    const selection = window.getSelection();
    const viewerEl = this.pdfViewer.viewer;

    if (
      !selection ||
      selection.isCollapsed ||
      !viewerEl ||
      !viewerEl.contains(selection.anchorNode) ||
      !viewerEl.contains(selection.focusNode)
    ) {
      this.options.onTextSelectCancel();
    } else {
      this.options.onTextSelected();
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
    const selection = window.getSelection();

    if (!selection) {
      return;
    }

    await this.remote.post(`/materials/${this.options.materialId}/marks`, {
      color,
      page,
    });

    selection.removeAllRanges();
  }

  createComment() {
    return;
  }
}
