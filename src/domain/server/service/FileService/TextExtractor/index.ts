import Queue from 'p-queue';

import { MimeTypes } from '#domain/server/model/file.js';

import type { Job } from './job.js';
import PDFTextExtractor from './PDFTextExtractor.js';
import ImageTextExtractor from './ImageTextExtractor.js';
import HTMLTextExtractor from './HTMLTextExtractor.js';

export default class TextExtractor {
  private readonly pdfTextExtractor = new PDFTextExtractor();
  private readonly imageTextExtractor = new ImageTextExtractor();
  private readonly tasks = new Queue({ concurrency: 1 });

  public addJob(job: Job) {
    if (this.tasks.sizeBy({ id: job.fileId }) > 0) {
      return;
    }

    this.tasks.add(this.extract.bind(this, job), { id: job.fileId });
  }

  private async extract({ fileId, getData, lang, mimeType, locationsToSkip, onExtract }: Job) {
    if (!TextExtractor.SUPPORT_MIME_TYPES.includes(mimeType)) {
      return;
    }

    const data = await getData(fileId);

    if (!data) {
      return;
    }

    const job = { data, lang, locationsToSkip };

    if (mimeType === MimeTypes.HTML) {
      const text = HTMLTextExtractor.extract(data);

      if (typeof text === 'string') {
        onExtract({ text, fileId, location: {} });
      }
    }

    if (mimeType === MimeTypes.PDF) {
      for await (const record of this.pdfTextExtractor.extract(job)) {
        onExtract({ ...record, fileId });
      }
    }

    if (mimeType.startsWith('image')) {
      const imageResult = await this.imageTextExtractor.extract(job);

      if (imageResult) {
        onExtract({ ...imageResult, fileId });
      }
    }
  }

  public async getTextUnitLength(data: ArrayBuffer, mimeType: string) {
    if (mimeType === MimeTypes.PDF) {
      return (await this.pdfTextExtractor.getDoc(data)).numPages;
    }

    return Promise.resolve(1);
  }

  public static SUPPORT_MIME_TYPES: string[] = [MimeTypes.PDF, MimeTypes.HTML];
}
