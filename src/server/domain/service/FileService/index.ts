import { Inject, Injectable, type OnApplicationBootstrap } from '@nestjs/common';
import { Worker } from 'node:worker_threads';
import path from 'node:path';
import compact from 'lodash/compact';
import { wrap } from 'comlink';
import nodeEndpoint from 'comlink/dist/umd/node-adapter';
import TaskQueue from 'queue';

import type { FileVO, FilesDTO, FileTextRecord, CreatedFile, UnfinishedTextExtraction, FileDTO } from 'model/file';
import { token as fileReaderToken, FileReader } from 'infra/fileReader';

import BaseService from '../BaseService';
import type TextExtraction from './TextExtraction';

@Injectable()
export default class FileService extends BaseService implements OnApplicationBootstrap {
  @Inject(fileReaderToken) private readonly fileReader!: FileReader;

  private extraction?: TextExtraction;
  private extractionWorker?: Worker;

  private extractingTextTaskQueue = new TaskQueue({ concurrency: 1, autostart: true });
  private fileIdsOnQueue = new Set<FileVO['id']>();

  onApplicationBootstrap() {
    if (this.runtime.isMain()) {
      this.resumeUnfinishedTextExtraction();
    }
  }

  private async loadFile(file: FileDTO) {
    if (file.data) {
      return { data: file.data, mimeType: file.mimeType, lang: file.lang };
    }

    if (file.path) {
      const localFile = await this.fileReader.readLocalFile(file.path);
      return localFile && { ...localFile, mimeType: file.mimeType, lang: file.lang };
    }
  }

  async createFiles(files: FilesDTO) {
    const tasks = files.map(this.loadFile.bind(this));
    const loadedFiles = await Promise.all(tasks);
    const fileVOs = await this.repo.files.batchCreate(compact(loadedFiles));
    const result: (FileVO | null)[] = loadedFiles.map(() => null);
    const createdFiles: CreatedFile[] = [];

    let j = 0;
    for (let i = 0; i < loadedFiles.length; i++) {
      if (loadedFiles[i]) {
        result[i] = fileVOs[j]!;
        createdFiles.push({ ...loadedFiles[i]!, id: fileVOs[j]!.id });
        j += 1;
      }
    }

    createdFiles
      .filter(({ id }) => !this.fileIdsOnQueue.has(id))
      .forEach(({ id }) => this.addTextExtractionJob({ fileId: id }));

    return result;
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

  async fetchRemoteFile(url: string) {
    const file = await this.fileReader.readRemoteFile(url);

    if (!file) {
      throw new Error(`can not request file: ${url}`);
    }

    return file;
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
      this.extractionWorker = new Worker(path.join(__dirname, 'TextExtraction')).setMaxListeners(Infinity);
      this.extraction = wrap<TextExtraction>(nodeEndpoint(this.extractionWorker));
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
      const { ocrCachePath } = this.runtime.getPaths();

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

  private async resumeUnfinishedTextExtraction() {
    const mimeTypes = ['application/pdf'];
    const unextracted = await this.repo.files.findTextUnextracted(mimeTypes);

    for (const job of unextracted) {
      this.addTextExtractionJob(job);
    }
  }
}
