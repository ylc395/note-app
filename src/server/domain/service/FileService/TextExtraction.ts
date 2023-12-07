import { type PDFDocumentProxy, getDocument } from 'pdfjs-dist';
import { parentPort } from 'node:worker_threads';
import { cpus } from 'node:os';
import path from 'node:path';
import { expose } from 'comlink';
import { createCanvas } from 'canvas';
import { OEM, createScheduler, createWorker, type Scheduler } from 'tesseract.js';
import nodeEndpoint from 'comlink/dist/umd/node-adapter.js';
import { range } from 'lodash-es';

export default class TextExtraction {
  private currentPdfDoc?: PDFDocumentProxy;
  private ocrScheduler?: Scheduler;

  async initPdf(data: ArrayBuffer) {
    const doc = await getDocument(new Uint8Array(data)).promise;
    this.currentPdfDoc = doc;

    return doc.numPages;
  }

  async getPdfTextContent(pageNum: number) {
    if (!this.currentPdfDoc) {
      throw new Error('no pdf document');
    }

    const page = await this.currentPdfDoc.getPage(pageNum);
    const textContent = await page.getTextContent();

    let text = '';

    for (const item of textContent.items) {
      if ('str' in item) {
        text += item.str;
      }
    }
    return text;
  }

  async initOcr({ cachePath, maxConcurrency, lang }: { cachePath: string; maxConcurrency: number; lang: string }) {
    if (this.ocrScheduler) {
      throw new Error('is doing ocr');
    }

    if (!this.currentPdfDoc) {
      throw new Error('no pdf document');
    }

    const workerCount = Math.max(Math.min(cpus().length, this.currentPdfDoc.numPages, maxConcurrency), 1);

    this.ocrScheduler = createScheduler();

    const workers = await Promise.all(
      range(0, workerCount).map(() =>
        createWorker(lang, OEM.DEFAULT, {
          corePath: path.join(process.cwd(), 'node_modules/tesseract.js-core'),
          cachePath,
          workerBlobURL: false,
          logger: console.log,
        }),
      ),
    );

    for (const worker of workers) {
      this.ocrScheduler.addWorker(worker);
    }

    return workers.length;
  }

  async cleanup() {
    if (this.currentPdfDoc) {
      await this.currentPdfDoc.destroy();
      this.currentPdfDoc = undefined;
    }

    if (this.ocrScheduler) {
      await this.ocrScheduler.terminate();
      this.ocrScheduler = undefined;
    }
  }

  async getPdfImageTextContent(pageNum: number) {
    if (!this.currentPdfDoc || !this.ocrScheduler) {
      throw new Error('no pdf document');
    }

    const scale = 2;
    const page = await this.currentPdfDoc.getPage(pageNum);
    const viewport = page.getViewport({ scale });
    const canvas = createCanvas(viewport.width, viewport.height);
    const renderTask = page.render({ viewport, canvasContext: canvas.getContext('2d') });

    await renderTask.promise;

    const image = canvas.toBuffer();
    const result = await this.ocrScheduler.addJob('recognize', image);

    return {
      text: result.data.text,
      location: {
        page: pageNum,
        scale,
        words: result.data.words.map((word) => ({
          text: word.text,
          box: word.bbox,
        })),
      },
    };
  }
}

// we can not use PDFWorker because nodejs doesn't support web worker.
// see https://github.com/nodejs/node/issues/43583
// so we use worker_threads (comlink) here
parentPort!.setMaxListeners(Infinity);
expose(new TextExtraction(), nodeEndpoint.default(parentPort!));
