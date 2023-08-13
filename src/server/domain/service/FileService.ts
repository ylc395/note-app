import { Inject, Injectable } from '@nestjs/common';
import compact from 'lodash/compact';

import { type FileVO, type FilesDTO, isFileUrl } from 'model/file';
import { token as downloaderToken, Downloader } from 'infra/downloader';

import BaseService from './BaseService';

@Injectable()
export default class FileService extends BaseService {
  @Inject(downloaderToken) private readonly downloader!: Downloader;

  async createFiles(files: FilesDTO) {
    const tasks = files.map(async (file) => {
      if (isFileUrl(file)) {
        return this.downloader.downloadFile(file.url);
      }

      if (file.data) {
        return {
          name: file.name || 'untitled',
          data: file.data,
          mimeType: file.mimeType,
        };
      }

      if (file.path) {
        const downloaded = await this.downloader.downloadFile(`file://${file.path}`);
        return downloaded && { ...downloaded, mimeType: file.mimeType };
      }
    });

    const downloadedFiles = await Promise.all(tasks);

    return await this.files.batchCreate(compact(downloadedFiles));
  }

  async queryFileById(id: FileVO['id']) {
    const file = await this.files.findOneById(id);

    if (file) {
      return file;
    }

    throw new Error('invalid url');
  }

  async fetchWebFileMetadata(url: string) {
    const abortController = new AbortController();
    const res = await fetch(url, { signal: abortController.signal });

    abortController.abort();

    if (!res.ok) {
      throw new Error('can not request file');
    }

    return {
      mimeType: res.headers.get('content-type') || '',
      size: Number(res.headers.get('content-length')),
    };
  }
}
