import Queue from 'p-queue';

import { MimeTypes } from '#domain/server/model/file.js';
import container from '#utils/singletonContainer.js';

import type { Job } from './job.js';
import PDFTextExtractor from './PDFTextExtractor.js';
import ImageTextExtractor from './ImageTextExtractor.js';
import HTMLTextExtractor from './HTMLTextExtractor.js';

export default class TextExtractor {
  private readonly pdfTextExtractor = container.resolve(PDFTextExtractor);
  private readonly imageTextExtractor = container.resolve(ImageTextExtractor);

  // 我们一次只处理一个文件。仅仅是处理单个文件常常就已经涉及到并行了（例如一个 PDF 文件包括多个页面）；并行处理多个文件的意义不大
  // 此外，如果对文件的处理是在主线程进行的（例如解析+提取文本信息），则也不存在并行处理一说（主线程只能阻塞逐一处理）
  // 综上，把 concurrency 设置为 1
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
      return this.pdfTextExtractor.extract({ ...job, onExtract: (result) => onExtract({ ...result, fileId }) });
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
