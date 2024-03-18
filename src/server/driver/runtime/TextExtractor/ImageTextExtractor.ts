import assert from 'node:assert';
import { recognize } from 'tesseract.js';
import path from 'node:path';
import { container, singleton } from 'tsyringe';

import type { Job, Result } from '@domain/service/FileService/TextExtractor.js';
import { token as runtimeToken } from '@domain/infra/runtime.js';
import { token as loggerToken } from '@domain/infra/logger.js';

@singleton()
export default class ImageTextExtractor {
  private readonly runtime = container.resolve(runtimeToken);
  private readonly logger = container.resolve(loggerToken);
  private isBusy = false;
  public async extract(job: {
    data: ArrayBuffer;
    lang: Job['lang'];
    onExtracted?: (result: Omit<Result, 'fileId'>) => void;
  }) {
    // in nodejs, pdf.worker.js won't work
    // because it's a web worker, not a nodejs worker. see https://github.com/nodejs/node/issues/43583
    // so everything about pdf is done in main thread(so called "fake worker").
    assert(!this.isBusy, 'PDFTextExtractor is busy');

    this.isBusy = true;
    const recognizeResult = await recognize(job.data, job.lang, {
      corePath: path.join(process.cwd(), 'node_modules/tesseract.js-core'),
      cachePath: path.join(this.runtime.getAppDir(), 'ocr_cache'),
      workerBlobURL: false,
      logger: this.logger.debug,
    });

    this.isBusy = false;

    const result = {
      text: recognizeResult.data.text,
      location: {
        words: recognizeResult.data.words.map((word) => ({
          text: word.text,
          box: word.bbox,
        })),
      },
      isFinished: true,
    };

    job.onExtracted?.(result);

    return result;
  }
}
