import { Inject, Injectable } from '@nestjs/common';
import compact from 'lodash/compact';

import { type FileVO, type FilesDTO, isFileUrl } from 'model/file';
import { token as downloaderToken, FileReader } from 'infra/fileReader';

import BaseService from './BaseService';

@Injectable()
export default class FileService extends BaseService {
  @Inject(downloaderToken) private readonly fileReader!: FileReader;

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

    const result: (FileVO | null)[] = loadedFiles.map(() => null);

    let j = 0;
    for (let i = 0; i < loadedFiles.length; i++) {
      if (loadedFiles[i]) {
        result[i] = fileVOs[j]!;
        j += 1;
      }
    }

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
}
