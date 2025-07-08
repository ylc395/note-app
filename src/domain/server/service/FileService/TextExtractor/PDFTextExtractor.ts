import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';
import path from 'node:path';
import Queue from 'p-queue';

import container from '#utils/singletonContainer.js';
import type { FileTextRecord } from '#domain/server/model/file.js';
import type { Job } from './job.js';
import ImageTextExtractor from './ImageTextExtractor.js';

export default class PDFTextExtractor {
  private readonly imageTextExtractor = container.resolve(ImageTextExtractor);

  private readonly queue = new Queue({ interval: 200, intervalCap: 1 });

  public async extract(job: {
    data: ArrayBuffer;
    locationsToSkip: Job['locationsToSkip'];
    lang: Job['lang'];
    onExtract: (e: Pick<Required<FileTextRecord>, 'location' | 'text'>) => void;
  }) {
    // in nodejs, pdf.worker.js won't work
    // because it's a web worker, not a nodejs worker. see https://github.com/nodejs/node/issues/43583
    // so everything about pdf is done in main thread(so called "fake worker").
    const doc = await this.getDoc(job.data);
    const totalPages = doc.numPages;
    const pagesToSkip = job.locationsToSkip?.map(({ page }) => page) || [];
    const tasks: Promise<void>[] = [];

    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      if (pagesToSkip.includes(pageNum)) {
        continue;
      }

      const task = this.queue.add(() => {
        return PDFTextExtractor.getTextContent(doc, pageNum).then((result) => {
          if (result || !ImageTextExtractor.isValidLangs(job.lang)) {
            job.onExtract(result || { location: { page: pageNum }, text: '' });
          } else {
            return this.extractPageTextContentByOcr(doc, pageNum, job);
          }
        });
      });

      tasks.push(task);
    }

    return Promise.all(tasks).then(() => doc.destroy());
  }

  private async extractPageTextContentByOcr(
    doc: pdfjs.PDFDocumentProxy,
    pageNum: number,
    {
      lang,
      onExtract,
    }: {
      lang: Job['lang'];
      onExtract: (e: Pick<Required<FileTextRecord>, 'location' | 'text'>) => void;
    },
  ) {
    // 从 https://github.com/mozilla/pdf.js/blob/master/examples/node/pdf2png/pdf2png.mjs 这里抄的
    const page = await doc.getPage(pageNum);
    const scale = 3;
    const viewport = page.getViewport({ scale });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const canvasAndContext = (doc.canvasFactory as any).create(viewport.width, viewport.height);
    await page.render({ viewport, canvasContext: canvasAndContext.context }).promise;

    const image: Uint8Array = canvasAndContext.canvas.toBuffer('image/png');
    const result: Pick<Required<FileTextRecord>, 'location' | 'text'> = await this.imageTextExtractor.extract({
      scale,
      data: image.buffer as ArrayBuffer,
      lang,
    });

    result.location.page = pageNum;
    page.cleanup();
    onExtract(result);
  }

  public getDoc(data: ArrayBuffer) {
    return pdfjs.getDocument({
      data: new Uint8Array(data.slice(0)),
      cMapUrl: path.resolve('node_modules/pdfjs-dist/cmaps') + '/',
      standardFontDataUrl: path.resolve('node_modules/pdfjs-dist/standard_fonts') + '/',
      cMapPacked: true,
    }).promise;
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

    return text ? { text, location: { page: pageNum } } : null;
  }
}
