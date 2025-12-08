import { parentPort } from 'node:worker_threads';
import { expose, transfer } from 'comlink';
import nodeEndpoint from 'comlink/dist/umd/node-adapter.js';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import assert from 'node:assert';

import { getDoc } from './utils';
import type { ExtractResult } from '../extractor';

export class WorkerApi {
  private doc?: PDFDocumentProxy;

  public async extract(pages: number[], onExtract: (result: ExtractResult) => void, onComplete: () => void) {
    Promise.all(pages.map((page) => this.getTextContent(page).then(onExtract))).then(onComplete);
  }

  public async getTextContent(pageNum: number) {
    assert(this.doc);

    const page = await this.doc.getPage(pageNum);
    const textContent = await page.getTextContent();

    let text = '';

    for (const item of textContent.items) {
      if ('str' in item) {
        text += item.str;
      }
    }

    page.cleanup();
    return { text, location: { page: pageNum } };
  }

  public async init(data: ArrayBuffer) {
    this.doc = await getDoc(data);
  }

  public getPagesCount() {
    assert(this.doc);
    return Promise.resolve(this.doc.numPages);
  }

  public async getPageImage(pageNum: number) {
    assert(this.doc);
    // 从 https://github.com/mozilla/pdf.js/blob/master/examples/node/pdf2png/pdf2png.mjs 这里抄的
    const page = await this.doc.getPage(pageNum);
    const scale = 3;
    const viewport = page.getViewport({ scale });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const canvasAndContext = (this.doc.canvasFactory as any).create(viewport.width, viewport.height);
    await page.render({ viewport, canvasContext: canvasAndContext.context }).promise;

    page.cleanup();
    const data: Uint8Array = canvasAndContext.canvas.toBuffer('image/png');

    return transfer({ data, scale }, [data.buffer]);
  }
}

const api = new WorkerApi();

expose(api, nodeEndpoint(parentPort!));

export default api;
