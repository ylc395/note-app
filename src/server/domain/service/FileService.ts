import { Inject, Injectable } from '@nestjs/common';
import compact from 'lodash/compact';

import type { FileVO, FilesDTO, File } from 'model/file';
import { token as downloaderToken, Downloader } from 'infra/downloader';

import BaseService from './BaseService';

@Injectable()
export default class FileService extends BaseService {
  @Inject(downloaderToken) private readonly downloader!: Downloader;

  async createFiles(files: FilesDTO) {
    const downloadTasks = files
      .filter((file) => typeof file === 'string')
      .map((file) => this.downloader.downloadFile(file as string));

    const downloadedFiles = await Promise.all(downloadTasks);

    return await this.files.batchCreate([
      ...(files.filter((file) => typeof file !== 'string') as File[]),
      ...compact(downloadedFiles),
    ]);
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
