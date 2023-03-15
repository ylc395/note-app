import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { parse as parseUrl } from 'node:url';
import path from 'node:path';
import { TextEncoder } from 'node:util';
import mapValues from 'lodash/mapValues';

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
    if (sourceUrl.startsWith('data:')) {
      const dataUrlResult = this.downloadDataUrl(sourceUrl);

      return typeof dataUrlResult === 'string' ? dataUrlResult : { name: '', sourceUrl, ...dataUrlResult };
    }

    const { pathname } = parseUrl(sourceUrl);

    if (!pathname) {
      throw new Error(`invalid url ${sourceUrl}`);
    }

    try {
      const name = path.basename(pathname);
      const { headers, data } = await axios.get<ArrayBuffer>(sourceUrl, { responseType: 'arraybuffer' });
      const mimeType = String(headers['content-type'] || '');

      return { name, mimeType, sourceUrl, data };
    } catch {
      return sourceUrl;
    }
  }

  private downloadDataUrl(dataUrl: string) {
    const dataUrlPattern = /^data:(.+?)?(;base64)?,(.+)/;
    const matchResult = dataUrl.match(dataUrlPattern);

    if (!matchResult) {
      return dataUrl;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [_, mimeType, base64Flag, content] = matchResult;

    if (!content) {
      return dataUrl;
    }

    return {
      mimeType: mimeType || 'text/plain',
      data: base64Flag
        ? Buffer.from(content, 'base64').buffer
        : new TextEncoder().encode(decodeURIComponent(content)).buffer,
    };
  }

  async request(url: string, type: 'arraybuffer' | 'text') {
    const res = await axios.get(url, { validateStatus: () => true, responseType: type, maxRedirects: 1 });

    return {
      body: res.data,
      headers: mapValues(res.headers, String),
      status: res.status,
    };
  }
}
