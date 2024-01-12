import { Worker } from 'node:worker_threads';
import path, { dirname } from 'node:path';
import { singleton } from 'tsyringe';
import { fileURLToPath } from 'node:url';
import { ensureDir } from 'fs-extra';

import { wrap } from 'comlink';
import nodeEndpoint from 'comlink/dist/umd/node-adapter.js';
import TaskQueue from 'queue';

import type { FileVO, FileTextRecord, CreatedFile, UnfinishedTextExtraction, FileDTO } from '@domain/model/file.js';

import BaseService from '../BaseService.js';
import type TextExtraction from './TextExtraction.js';
import FileReader from './FileReader.js';

@singleton()
export default class FileService extends BaseService {
  private extraction?: TextExtraction;
  private extractionWorker?: Worker;
  private extractingTextTaskQueue = new TaskQueue({ concurrency: 1, autostart: true });
  private fileIdsOnQueue = new Set<FileVO['id']>();
  private readonly fileReader = new FileReader();

  async createFile(file: FileDTO) {
    const data = file.data || (await this.fileReader.read(file.path!));
    const fileVO = await this.repo.files.create({ lang: '', ...file, data });

    if (!this.fileIdsOnQueue.has(fileVO.id)) {
      this.addTextExtractionJob({ fileId: fileVO.id });
    }

    return fileVO;
  }

  private addTextExtractionJob({ fileId, finished }: UnfinishedTextExtraction) {
    this.fileIdsOnQueue.add(fileId);
    this.extractingTextTaskQueue.push(() => this.extractText(fileId, finished));
  }

  async queryFileById(id: FileVO['id']) {
    const file = await this.repo.files.findOneById(id);
    const data = await this.repo.files.findBlobById(id);

    if (!file || !data) {
      throw new Error('invalid id');
    }

    return { mimeType: file.mimeType, data };
  }

  private readonly terminateExtraction = async () => {
    if (!this.extractionWorker) {
      throw new Error('no extraction');
    }

    await this.extractionWorker.terminate();
    this.extractionWorker = undefined;
    this.extraction = undefined;
  };

  private extractText = async (fileId: CreatedFile['id'], finished?: UnfinishedTextExtraction['finished']) => {
    if (!this.extraction) {
      this.extractionWorker = new Worker(
        path.join(dirname(fileURLToPath(import.meta.url)), 'TextExtraction'),
      ).setMaxListeners(Infinity);

      this.extraction = wrap<TextExtraction>(nodeEndpoint.default(this.extractionWorker));
    }

    const file = await this.repo.files.findOneById(fileId);
    const data = await this.repo.files.findBlobById(fileId);

    if (!file || !data) {
      return;
    }

    if (file.mimeType === 'application/pdf') {
      await this.extractPdfText({ ...file, data }, finished);
    }

    this.fileIdsOnQueue.delete(file.id);
    await this.repo.files.markTextExtracted(file.id);
    await this.extraction.cleanup();

    // is last one
    if (this.extractingTextTaskQueue.length === 1) {
      await this.terminateExtraction();
    }
  };

  private async extractPdfText(
    { id, data, lang }: Required<CreatedFile>,
    finished?: UnfinishedTextExtraction['finished'],
  ) {
    if (!this.extraction) {
      throw new Error('no extraction');
    }

    const pageCount = await this.extraction.initPdf(data);
    const records: FileTextRecord[] = [];

    for (let i = 1; i < pageCount; i++) {
      if (finished?.includes(i)) {
        continue;
      }

      const text = await this.extraction.getPdfTextContent(i);
      text && records.push({ text, location: { page: i } });
    }

    if (records.length > 0) {
      await this.repo.files.createText({ records, fileId: id });
    } else {
      const appDir = this.runtime.getAppDir();
      const ocrCachePath = path.join(appDir, 'ocr_cache');

      await ensureDir(ocrCachePath);
      const concurrency = await this.extraction.initOcr({
        cachePath: ocrCachePath,
        maxConcurrency: 4,
        lang,
      });

      const queue = new TaskQueue({ concurrency });

      for (let i = 1; i <= pageCount; i++) {
        if (finished?.includes(i)) {
          continue;
        }
        queue.push(async () => {
          const { text, location } = await this.extraction!.getPdfImageTextContent(i);
          // always save ocr result even if `text` is empty
          await this.repo.files.createText({ fileId: id, records: [{ text, location }] });
        });
      }

      await queue.start();
    }
  }

  public async resumeUnfinishedTextExtraction() {
    const mimeTypes = ['application/pdf'];
    const unextracted = await this.repo.files.findTextUnextracted(mimeTypes);

    for (const job of unextracted) {
      this.addTextExtractionJob(job);
    }
  }
}
