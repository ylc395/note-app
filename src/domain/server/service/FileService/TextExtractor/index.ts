import TaskQueue from 'queue';

import { MimeTypes, type File } from '@domain/server/model/file.js';
import type { JobResult, Job } from './job.js';

import PDFTextExtractor from './PDFTextExtractor.js';
import ImageTextExtractor from './ImageTextExtractor.js';
import HTMLTextExtractor from './HTMLTextExtractor.js';

export type { JobResult } from './job.js';

export default class TextExtractor {
  constructor(
    private readonly options: {
      onExtracted: (result: JobResult) => void;
    },
  ) {}

  private readonly pdfTextExtractor = new PDFTextExtractor();
  private readonly imageTextExtractor = new ImageTextExtractor();
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

    if (mimeType === MimeTypes.PDF) {
      for await (const pageResult of this.pdfTextExtractor.extract(job)) {
        this.options.onExtracted({ ...pageResult, fileId });
      }
    }

    if (mimeType.startsWith('image')) {
      const imageResult = await this.imageTextExtractor.extract(job);
      result = imageResult ? { ...imageResult, isFinished: true } : null;
    }

    this.tasks.fileIds.delete(fileId);

    if (result) {
      this.options.onExtracted({ ...result, fileId });
    }
  }
}
