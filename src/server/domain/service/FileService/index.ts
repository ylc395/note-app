import { Inject, Injectable } from '@nestjs/common';
import { Worker } from 'node:worker_threads';
import path from 'node:path';
import compact from 'lodash/compact';
import map from 'lodash/map';
import { wrap } from 'comlink';
import nodeEndpoint from 'comlink/dist/umd/node-adapter';

import { type FileVO, type FilesDTO, type FileTextRecord, type CreatedFile, isFileUrl } from 'model/file';
import { token as fileReaderToken, FileReader } from 'infra/fileReader';

import BaseService from '../BaseService';
import type TextExtraction from './TextExtraction';

@Injectable()
export default class FileService extends BaseService {
  @Inject(fileReaderToken) private readonly fileReader!: FileReader;

  private readonly extraction = wrap<TextExtraction>(nodeEndpoint(new Worker(path.join(__dirname, 'TextExtraction'))));

  async createFiles(files: FilesDTO) {
    const tasks = files.map(async (file) => {
      if (isFileUrl(file)) {
        return this.fileReader.readRemoteFile(file.url);
      }

      if (file.data) {
        return {
          data: file.data,
          mimeType: file.mimeType,
        };
      }

      if (file.path) {
        const localFile = await this.fileReader.readLocalFile(file.path);
        return localFile && { ...localFile, mimeType: file.mimeType };
      }

      throw new Error('invalid file');
    });

    const loadedFiles = await Promise.all(tasks);
    const fileVOs = await this.repo.files.batchCreate(compact(loadedFiles));
    const haveText = await this.repo.files.haveText(map(fileVOs, 'id'));
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

    createdFiles.filter(({ id }) => !haveText[id]).forEach(this.extractText);

    return result;
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
      throw new Error('can not request file');
    }

    return file;
  }

  private extractText = async ({ data, mimeType, id }: CreatedFile) => {
    let records: FileTextRecord[] | undefined;

    if (mimeType === 'application/pdf') {
      records = await this.extraction.extractPdfText(data);
    }

    if (!records) {
      return;
    }

    this.repo.files.createText({ records, fileId: id });
  };
}
