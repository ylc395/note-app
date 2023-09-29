import { getDocument } from 'pdfjs-dist';
import { parentPort } from 'node:worker_threads';
import type { FileTextRecord } from 'model/file';
import { expose } from 'comlink';
import nodeAdaptor from 'comlink/dist/umd/node-adapter';

export default class TextExtraction {
  async extractPdfText(data: ArrayBuffer) {
    // we can not use PDFWorker because nodejs doesn't support web worker.
    // see https://github.com/nodejs/node/issues/43583
    // so we use worker_threads (comlink) here
    const doc = await getDocument(new Uint8Array(data)).promise;
    const records: FileTextRecord[] = [];

    for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
      const page = await doc.getPage(pageNum);
      const textContent = await page.getTextContent();

      let text = '';

      for (const item of textContent.items) {
        if ('str' in item) {
          text += item.str;
        }
      }

      text && records.push({ text, location: String(pageNum) });
    }

    return records;
  }
}

expose(new TextExtraction(), nodeAdaptor(parentPort!));
