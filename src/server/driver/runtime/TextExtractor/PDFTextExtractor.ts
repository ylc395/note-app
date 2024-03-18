import pdfjs from 'pdfjs-dist';
import assert from 'node:assert';
import { createCanvas } from 'canvas';
import { container, singleton } from 'tsyringe';

import type { Job, Result } from '@domain/service/FileService/TextExtractor.js';
import ImageTextExtractor from './ImageTextExtractor.js';

@singleton()
export default class PDFTextExtractor {
  private imageTextExtractor = container.resolve(ImageTextExtractor);
  private isBusy = false;
  public async extract(job: {
    data: ArrayBuffer;
    lang: Job['lang'];
    skipLocations: Job['skipLocations'];
    onExtracted: (result: Omit<Result, 'fileId'>) => void;
  }) {
    // in nodejs, pdf.worker.js won't work
    // because it's a web worker, not a nodejs worker. see https://github.com/nodejs/node/issues/43583
    // so everything about pdf is done in main thread(so called "fake worker").
    assert(!this.isBusy, 'PDFTextExtractor is busy');

    this.isBusy = true;

    const doc = await pdfjs.getDocument(new Uint8Array(job.data)).promise;
    const pagesToSkip =
      job.skipLocations?.map(({ page }) => {
        assert(typeof page === 'number');
        return page;
      }) || [];

    const totalPages = doc.numPages;

    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      if (pagesToSkip.includes(pageNum)) {
        continue;
      }

      const result =
        (await PDFTextExtractor.getTextContent(doc, pageNum)) ||
        (await this.getTextContentByOcr(doc, pageNum, job.lang));

      await job.onExtracted({
        ...result,
        isFinished: pageNum === totalPages,
      });
    }

    doc.destroy();
    this.isBusy = false;
  }

  private async getTextContentByOcr(doc: pdfjs.PDFDocumentProxy, pageNum: number, lang: string) {
    const scale = 2;
    const page = await doc.getPage(pageNum);
    const viewport = page.getViewport({ scale });
    const canvas = createCanvas(viewport.width, viewport.height);
    const renderTask = page.render({ viewport, canvasContext: canvas.getContext('2d') });

    await renderTask.promise;

    const image = canvas.toBuffer();
    const result = await this.imageTextExtractor.extract({ data: image, lang });

    return result;
  }

  private static async getTextContent(doc: pdfjs.PDFDocumentProxy, pageNum: number) {
    const page = await doc.getPage(pageNum);
    const textContent = await page.getTextContent();

    let text = '';

    for (const item of textContent.items) {
      if ('str' in item) {
        text += item.str;
      }
    }

    return {
      text,
      location: { page: pageNum },
    };
  }
}
