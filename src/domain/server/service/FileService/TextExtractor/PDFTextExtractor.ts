import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';
import assert from 'node:assert';
import { createCanvas } from 'canvas';
import type { RenderParameters } from 'pdfjs-dist/types/src/display/api.js';

import container from '#utils/singletonContainer.js';
import { toArrayBuffer } from '#utils/file.js';
import type { Job } from './job.js';
import ImageTextExtractor from './ImageTextExtractor.js';

export default class PDFTextExtractor {
  private imageTextExtractor = container.resolve(ImageTextExtractor);
  public async *extract(job: { data: ArrayBuffer; lang: Job['lang']; locationsToSkip: Job['locationsToSkip'] }) {
    // in nodejs, pdf.worker.js won't work
    // because it's a web worker, not a nodejs worker. see https://github.com/nodejs/node/issues/43583
    // so everything about pdf is done in main thread(so called "fake worker").
    const doc = await pdfjs.getDocument(new Uint8Array(job.data)).promise;
    const pagesToSkip =
      job.locationsToSkip?.map(({ page }) => {
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

      yield {
        ...result,
        isFinished: pageNum === totalPages,
      };
    }

    doc.destroy();
  }

  private async getTextContentByOcr(doc: pdfjs.PDFDocumentProxy, pageNum: number, lang: string[]) {
    const scale = 2;
    const page = await doc.getPage(pageNum);
    const viewport = page.getViewport({ scale });
    const canvas = createCanvas(viewport.width, viewport.height);
    const renderTask = page.render({
      viewport,
      canvasContext: canvas.getContext('2d') as unknown as RenderParameters['canvasContext'],
    });

    await renderTask.promise;

    const image = toArrayBuffer(canvas.toBuffer());
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
