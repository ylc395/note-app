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
        const remoteFile = await this.fileReader.readRemoteFile(file.url);
        return remoteFile && { ...remoteFile, sourceUrl: file.url };
      }

      if (file.data) {
        return {
          name: file.name || 'untitled',
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
    return await this.files.batchCreate(compact(loadedFiles));
  }

  async queryFileById(id: FileVO['id']) {
    const file = await this.files.findOneById(id);
    const data = await this.files.findBlobById(id);

    if (!file || !data) {
      throw new Error('invalid url');
    }

    return { ...file, data };
  }

  async fetchRemoteFile(url: string) {
    const file = await this.fileReader.readRemoteFile(url);

    if (!file) {
      throw new Error('can not request file');
    }

    return file;
  }
}
