import { from, mergeMap, Observable, Subscriber } from 'rxjs';
import { compact, difference, range } from 'lodash-es';
import { wrap, proxy, releaseProxy } from 'comlink';
import nodeEndpoint from 'comlink/dist/umd/node-adapter.js';
import assert from 'node:assert';

import type { ExtractResult, Job, TextExtractor } from '../extractor.js';
import ImageTextExtractor from '../ImageTextExtractor.js';
import { getDoc } from './utils.js';
import type workerApi from './extractor.js';
import createWorker from './extractor.js?nodeWorker';

type WorkerApi = typeof workerApi;

export default class PDFTextExtractor implements TextExtractor {
  constructor(lang: string[]) {
    this.imageTextExtractor = new ImageTextExtractor(lang, true);
  }

  private readonly imageTextExtractor: ImageTextExtractor;

  public async getTextUnitLength(data: ArrayBuffer) {
    const doc = await getDoc(data);
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
    const workerApi = wrap<WorkerApi>(nodeEndpoint(createWorker()));
    await workerApi.init(data);

    const totalPages = await workerApi.getPagesCount();

    // 去掉已经识别过的页码
    let pages = difference(range(1, totalPages + 1), compact(locationsToSkip?.map(({ page }) => page)));

    let strategy: 'ocr' | 'extract' = 'extract';
    const pagesToCheck: Record<number, { ocr?: ExtractResult; extract?: ExtractResult }> = {};

    await Promise.all(
      // 我们最多取 2 页，对它们“直接提取”和 OCR 都用一遍，看下结果，决定整个文档用哪种策略
      range(Math.min(pages.length, 2))
        .map((n, _, arr) => Math.ceil((pages.length / (arr.length + 1)) * (n + 1)))
        .flatMap((page) => [
          workerApi.getTextContent(Number(page)).then((result) => {
            pagesToCheck[Number(page)] ??= {};
            pagesToCheck[Number(page)]!.extract = result;
          }),

          this.extractPageTextContentByOcr(workerApi, Number(page)).then((result) => {
            pagesToCheck[Number(page)] ??= {};
            pagesToCheck[Number(page)]!.ocr = result;
          }),
        ]),
    );

    if (
      // 如果每个 OCR 结果的字数都至少是直接提取的 1.3 倍，就用 OCR
      Object.values(pagesToCheck).every(
        ({ ocr, extract }) => (ocr?.text.length ?? 0) / (extract?.text.length || 1) > 1.3,
      )
    ) {
      strategy = 'ocr';
    }

    // 上报已经提取过的文字
    for (const result of Object.values(pagesToCheck)) {
      subscriber.next(result[strategy]!);
    }

    let subscription;
    pages = difference(pages, Object.keys(pagesToCheck).map(Number));

    if (strategy === 'ocr') {
      subscription = from(pages)
        .pipe(
          mergeMap((page) => this.extractPageTextContentByOcr(workerApi, page), this.imageTextExtractor.concurrency),
        )
        .subscribe(subscriber);
    }

    if (strategy === 'extract') {
      subscription = new Observable<ExtractResult>((subscriber) => {
        workerApi.extract(pages, proxy(subscriber.next.bind(subscriber)), proxy(subscriber.complete.bind(subscriber)));
      }).subscribe(subscriber);
    }

    assert(subscription);
    subscription.add(workerApi[releaseProxy]); // rxjs 会在流结束后自动 unsubscribe 从而触发 releaseProxy
  }

  private async extractPageTextContentByOcr(workerApi: WorkerApi, pageNum: number) {
    const { scale, data } = await workerApi.getPageImage(pageNum);
    const result = await this.imageTextExtractor.extract({
      scale,
      data: data.buffer as ArrayBuffer,
    });

    result.location.page = pageNum;
    return result;
  }
}
