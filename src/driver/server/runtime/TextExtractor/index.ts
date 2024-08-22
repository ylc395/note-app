import TaskQueue from 'queue';
import assert from 'assert';
import { container } from 'tsyringe';

import { MimeTypes, type File } from '@domain/server/model/file.js';
import type {
  JobResult,
  TextExtractor as ITextExtractor,
  Job,
} from '@domain/server/service/FileService/TextExtractor.js';

import PDFTextExtractor from './PDFTextExtractor.js';
import ImageTextExtractor from './ImageTextExtractor.js';
import HTMLTextExtractor from './HTMLTextExtractor.js';

export default class SimpleTextExtractor implements ITextExtractor {
  private _onExtracted?: (result: JobResult) => Promise<void>;
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

    this.tasks.queue.push(this.extract.bind(this, job));
  }

  private async extract({ fileId, getData, lang, mimeType, locationsToSkip }: Job) {
    assert(this._onExtracted, 'onExtracted not existed');

    const data = await getData(fileId);

    if (!data) {
      return;
    }

    const job = { data, lang, locationsToSkip };

    let result: Omit<JobResult, 'fileId'> | null = null;

    if (mimeType === MimeTypes.HTML) {
      const text = HTMLTextExtractor.extract(data);
      result = typeof text === 'string' ? { isFinished: true, location: {}, text } : null;
    }

    if (mimeType.startsWith('image')) {
      const imageText = await this.imageTextExtractor.extract(job);
      result = imageText ? { ...imageText, isFinished: true } : null;
    }

    if (mimeType === MimeTypes.PDF) {
      for await (const pageResult of this.pdfTextExtractor.extract(job)) {
        this._onExtracted({ ...pageResult, fileId });
      }
    }

    this.tasks.fileIds.delete(fileId);

    if (result) {
      this._onExtracted({ ...result, fileId });
    }
  }

  public onExtracted(cb: (result: JobResult) => Promise<void>) {
    this._onExtracted = cb;
  }
}
