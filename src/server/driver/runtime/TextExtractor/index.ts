import TaskQueue from 'queue';
import assert from 'assert';
import { container } from 'tsyringe';

import { mimeTypes, type File } from '@domain/model/file.js';
import type { Result, TextExtractor, Job } from '@domain/service/FileService/TextExtractor.js';
import PDFTextExtractor from './PDFTextExtractor.js';
import ImageTextExtractor from './ImageTextExtractor.js';
import HTMLTextExtractor from './HTMLTextExtractor.js';

export default class SimpleTextExtractor implements TextExtractor {
  private _onExtracted?: (result: Result) => Promise<void>;
  private readonly pdfTextExtractor = container.resolve(PDFTextExtractor);
  private readonly imageTextExtractor = container.resolve(ImageTextExtractor);
  private readonly tasks = {
    queue: new TaskQueue({ concurrency: 1, autostart: true }),
    fileIds: new Set<Required<File>['id']>(),
  } as const;

  public addJob(job: Job) {
    if (this.tasks.fileIds.has(job.fileId)) {
      return;
    }

    this.tasks.queue.push(() => this.extract(job));
  }

  private async extract({ fileId, getData, skipLocations, lang, mimeType }: Job) {
    const data = await getData(fileId);

    if (!data) {
      return;
    }

    const job = {
      data,
      lang,
      skipLocations,
      onExtracted: (result: Omit<Result, 'fileId'>) => {
        assert(this._onExtracted, 'onExtracted not existed');
        return this._onExtracted({ ...result, fileId });
      },
    };

    if (mimeType === mimeTypes.PDF) {
      await this.pdfTextExtractor.extract(job);
    }

    if (mimeType === mimeTypes.HTML) {
      HTMLTextExtractor.extract(job);
    }

    if (mimeType.startsWith('image')) {
      await this.imageTextExtractor.extract(job);
    }
  }

  public onExtracted(cb: (result: Result) => Promise<void>) {
    this._onExtracted = cb;
  }
}
