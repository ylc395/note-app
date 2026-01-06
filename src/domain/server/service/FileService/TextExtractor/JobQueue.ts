import Queue from 'p-queue';
import { from } from 'rxjs';

import { MimeTypes } from '#domain/server/model/file.js';

import PDFTextExtractor from './PDFTextExtractor/index.js';
import ImageTextExtractor from './ImageTextExtractor.js';
import HTMLTextExtractor from './HTMLTextExtractor/index.js';
import type { Job, TextExtractor } from './extractor.js';

export default class JobQueue {
  // 我们一次只处理一个文件。仅仅是处理单个文件常常就已经涉及到并行了（例如一个 PDF 文件包括多个页面）；并行处理多个文件的意义不大
  // 此外，如果对文件的处理是在主线程进行的（例如解析+提取文本信息），则也不存在并行处理一说（主线程只能阻塞逐一处理）
  // 综上，把 concurrency 设置为 1
  private readonly tasks = new Queue({ concurrency: 1 });

  public addJob(job: Job) {
    if (this.tasks.sizeBy({ id: job.fileId }) !== 0) {
      return;
    }

    return this.tasks.add(this.extract.bind(this, job), { id: job.fileId });
  }

  private async extract({ fileId, getData, textExtractor, locationsToSkip, onExtract }: Job) {
    const extractor = typeof textExtractor === 'function' ? textExtractor() : textExtractor;

    if (!extractor) {
      return;
    }

    const data = await getData(fileId);

    if (!data) {
      return;
    }

    return new Promise<void>((resolve) => {
      from(extractor.extract({ data, locationsToSkip })).subscribe({
        next: (record) => {
          onExtract({ ...record, fileId });
        },
        complete: () => {
          extractor.destroy?.();
          resolve();
        },
      });
    });
  }

  public static getExtractor(params: { mimeType: string; lang: string[] }): TextExtractor | null {
    if (!JobQueue.SUPPORT_MIME_TYPES.includes(params.mimeType)) {
      return null;
    }
    if (params.mimeType === MimeTypes.PDF) {
      return new PDFTextExtractor(params.lang);
    }

    if (params.mimeType === MimeTypes.HTML) {
      return new HTMLTextExtractor();
    }

    if (params.mimeType.startsWith('image/')) {
      return new ImageTextExtractor(params.lang);
    }

    return null;
  }

  public static SUPPORT_MIME_TYPES: string[] = [
    MimeTypes.PDF,
    MimeTypes.HTML,
    ...ImageTextExtractor.SUPPORT_MIME_TYPES,
  ];
}
