import { type PDFDocumentProxy, getDocument } from 'pdfjs-dist';
import { parentPort } from 'node:worker_threads';
import { cpus } from 'node:os';
import path from 'node:path';
import { expose } from 'comlink';
import { createCanvas } from 'canvas';
import { OEM, createScheduler, createWorker, type Scheduler } from 'tesseract.js';
import nodeAdaptor from 'comlink/dist/umd/node-adapter';
import range from 'lodash/range';

import type { FileVO } from 'model/file';

export default class TextExtraction {
  private currentPdfDoc?: PDFDocumentProxy;
  private ocrScheduler?: Scheduler;

  async initPdf(id: FileVO['id'], data: ArrayBuffer) {
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

  async initOcr(cachePath: string) {
    if (this.ocrScheduler) {
      throw new Error('is doing ocr');
    }

    if (!this.currentPdfDoc) {
      throw new Error('no pdf document');
    }

    const workerCount = Math.min(cpus().length, 4);
    this.ocrScheduler = createScheduler();

    const workers = await Promise.all(
      range(0, Math.min(workerCount, this.currentPdfDoc.numPages)).map(() =>
        createWorker('chi_sim', OEM.DEFAULT, {
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

    return this.ocrScheduler.getNumWorkers();
  }

  async cleanup() {
    if (!this.currentPdfDoc) {
      throw new Error('no pdf document');
    }

    if (this.ocrScheduler) {
      await this.ocrScheduler.terminate();
    }

    await this.currentPdfDoc.destroy();
    this.ocrScheduler = undefined;
    this.currentPdfDoc = undefined;
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
expose(new TextExtraction(), nodeAdaptor(parentPort!));
