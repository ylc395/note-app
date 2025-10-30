import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';
import path from 'node:path';
import { setTimeout } from 'node:timers/promises';
import { from, mergeMap, Observable, Subscriber } from 'rxjs';
import { compact, difference, range } from 'lodash-es';

import type { ExtractResult, Job, TextExtractor } from './extractor.js';
import ImageTextExtractor from './ImageTextExtractor.js';
import assert from 'node:assert';

export default class PDFTextExtractor implements TextExtractor {
  constructor(lang: Job['lang']) {
    this.imageTextExtractor = new ImageTextExtractor(lang, true);
  }

  private readonly imageTextExtractor: ImageTextExtractor;

  public async getTextUnitLength(data: ArrayBuffer) {
    const doc = await PDFTextExtractor.getDoc(data);
    const num = doc.numPages;
    await doc.destroy();

    return num;
  }

  public extract(job: { data: ArrayBuffer; locationsToSkip?: Job['locationsToSkip'] }) {
    return new Observable<ExtractResult>((subscriber) => {
      this.startExtracting(job, subscriber);
    });
  }

  public destroy() {
    this.imageTextExtractor.destroy();
  }

  private async startExtracting(
    { data, locationsToSkip }: { data: ArrayBuffer; locationsToSkip?: Job['locationsToSkip'] },
    subscriber: Subscriber<ExtractResult>,
  ) {
    const doc = await PDFTextExtractor.getDoc(data);
    const totalPages = doc.numPages;

    // 去掉已经识别过的页码
    const pages = difference(range(1, totalPages + 1), compact(locationsToSkip?.map(({ page }) => page)));

    let strategy: 'ocr' | 'extract' = 'extract';
    const pagesToCheck: Record<number, { ocr?: ExtractResult; extract?: ExtractResult }> = {};

    await Promise.all(
      // 我们最多取 2 页，对它们“直接提取”和 OCR 都用一遍，看下结果，决定整个文档用哪种策略
      range(Math.min(pages.length, 2))
        .map((n, _, arr) => Math.ceil((pages.length / (arr.length + 1)) * (n + 1)))
        .flatMap((page) => [
          PDFTextExtractor.getTextContent(doc, Number(page)).then((result) => {
            pagesToCheck[Number(page)] = { extract: result };
          }),

          this.extractPageTextContentByOcr(doc, Number(page)).then((result) => {
            pagesToCheck[Number(page)] = { ocr: result };
          }),
        ]),
    );

    if (
      // 如果每个 OCR 结果的字数都至少是直接提取的 1.3 倍，就用 OCR
      Object.values(pagesToCheck).every(
        ({ ocr, extract }) => (ocr?.text.length ?? 0) / (extract?.text.length ?? 1) > 1.3,
      )
    ) {
      strategy = 'ocr';
    }

    const extract = async (page: number) => {
      const checked = pagesToCheck[Number(page)]?.[strategy];

      if (checked) {
        return checked;
      }

      if (strategy === 'extract') {
        await setTimeout(500); // 避免在一瞬间完成所有页面的文字提取和保存，那样会很卡
        return PDFTextExtractor.getTextContent(doc, page);
      }

      if (strategy === 'ocr') {
        return this.extractPageTextContentByOcr(doc, page);
      }

      assert.fail('no strategy');
    };

    from(pages)
      .pipe(mergeMap(extract, strategy === 'extract' ? 1 : undefined))
      .subscribe(subscriber)
      .add(() => {
        doc.destroy();
      });
  }

  private async extractPageTextContentByOcr(doc: pdfjs.PDFDocumentProxy, pageNum: number) {
    // 从 https://github.com/mozilla/pdf.js/blob/master/examples/node/pdf2png/pdf2png.mjs 这里抄的
    const page = await doc.getPage(pageNum);
    const scale = 3;
    const viewport = page.getViewport({ scale });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const canvasAndContext = (doc.canvasFactory as any).create(viewport.width, viewport.height);
    await page.render({ viewport, canvasContext: canvasAndContext.context }).promise;

    const image: Uint8Array = canvasAndContext.canvas.toBuffer('image/png');

    const result = await this.imageTextExtractor.extract({
      scale,
      data: image.buffer as ArrayBuffer,
    });

    result.location.page = pageNum;
    page.cleanup();

    return result;
  }

  private static getDoc(data: ArrayBuffer) {
    // warning: pdf.js 在 node 环境里没有多线程解析 PDF 文档的能力，一切都发生在主线程里（所谓的 fake worker）
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

    page.cleanup();
    return { text, location: { page: pageNum } };
  }
}
