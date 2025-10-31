import { parentPort } from 'node:worker_threads';
import { expose, transfer } from 'comlink';
import nodeEndpoint from 'comlink/dist/umd/node-adapter.js';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import assert from 'node:assert';

import { getDoc } from './utils';
import type Api from './workerApi';

class WorkerApi implements Api {
  private doc?: PDFDocumentProxy;

  public readonly extract: Api['extract'] = async (pages, onExtract, onComplete) => {
    Promise.all(pages.map((page) => this.getTextContent(page).then(onExtract))).then(onComplete);
  };

  public readonly getTextContent: Api['getTextContent'] = async (pageNum) => {
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
  };

  public readonly init: Api['init'] = async (data) => {
    this.doc = await getDoc(data);
  };

  public readonly getPagesCount: Api['getPagesCount'] = () => {
    assert(this.doc);
    return Promise.resolve(this.doc.numPages);
  };

  public readonly getPageImage: Api['getPageImage'] = async (pageNum) => {
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
  };

  public readonly destroy: Api['destroy'] = async () => {
    await this.doc?.destroy();
    parentPort?.close();
  };
}

expose(new WorkerApi(), nodeEndpoint(parentPort!));
