import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { parse as parseUrl } from 'node:url';
import path from 'node:path';

import { type FilesDTO, type FileUrl, isUrls } from 'interface/File';
import { Transaction } from 'infra/Database';
import { buildIndex } from 'utils/collection';

import BaseService from './BaseService';

@Injectable()
export default class FileService extends BaseService {
  @Transaction
  async handleUpload(files: FilesDTO['files']) {
    if (isUrls(files)) {
      const existedFiles = buildIndex(await this.files.findAll({ sourceUrl: files }), 'sourceUrl');
      const rawFiles = await Promise.all(
        files.map(async (url) => {
          const existedFile = existedFiles[url];

          if (existedFile) {
            return existedFile;
          }

          const rawFile = await this.downloadFile(url);

          return typeof rawFile === 'string' ? rawFile : this.files.create(rawFile);
        }),
      );

      return rawFiles;
    } else {
      return this.files.batchCreate(files);
    }
  }

  private async downloadFile(sourceUrl: FileUrl) {
    const { pathname } = parseUrl(sourceUrl);

    if (!pathname) {
      throw new Error(`invalid url ${sourceUrl}`);
    }

    try {
      const name = path.basename(pathname);
      const { headers, data } = await axios.get<ArrayBuffer>(sourceUrl, { responseType: 'arraybuffer' });
      const mimeType = String(headers['Content-Type'] || '');

      return { name, mimeType, sourceUrl, data };
    } catch {
      return sourceUrl;
    }
  }
}
