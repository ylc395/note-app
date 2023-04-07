import { Injectable } from '@nestjs/common';
import { parse as parseUrl } from 'node:url';
import path from 'node:path';
import { TextEncoder } from 'node:util';
import fromParis from 'lodash/fromPairs';

import { type ResourcesDTO, type ResourceUrl, isUrls } from 'interface/resource';
import { Transaction } from 'infra/Database';
import { appFileProtocol } from 'infra/electronProtocol';
import { buildIndex } from 'utils/collection';

import BaseService from './BaseService';

// remove this once native fetch type is launched in @types/node
// see https://github.com/DefinitelyTyped/DefinitelyTyped/issues/60924#issuecomment-1358424866
declare global {
  export const { fetch, FormData, Headers, Request, Response }: typeof import('undici');
}

@Injectable()
export default class FileService extends BaseService {
  @Transaction
  async handleUpload(files: ResourcesDTO['files']) {
    if (isUrls(files)) {
      const existedFiles = buildIndex(await this.resources.findAll({ sourceUrl: files }), 'sourceUrl');
      const rawFiles = await Promise.all(
        files.map(async (url) => {
          const existedFile = existedFiles[url];

          if (existedFile) {
            return existedFile;
          }

          const rawFile = await this.downloadFile(url);

          return typeof rawFile === 'string' ? rawFile : this.resources.create(rawFile);
        }),
      );

      return rawFiles;
    } else {
      return this.resources.batchCreate(files);
    }
  }

  private async downloadFile(sourceUrl: ResourceUrl) {
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
      const res = await fetch(sourceUrl);

      return { name, sourceUrl, mimeType: res.headers.get('content-type') || '', data: await res.arrayBuffer() };
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

  async request(url: string, type: 'arrayBuffer' | 'text') {
    const res = await fetch(url);

    return {
      body: await res[type](),
      headers: fromParis(Array.from(res.headers.entries())),
      status: res.status,
    };
  }

  async requestMetadata(url: string) {
    const fileId = FileService.getResourceIdFromUrl(url);

    if (fileId) {
      const file = await this.resources.findOneById(fileId);
      return file ? { mimeType: file.mimeType } : null;
    }

    const abortController = new AbortController();
    const res = await fetch(url, { signal: abortController.signal });

    abortController.abort();

    if (!res.ok) {
      return null;
    }

    return {
      mimeType: res.headers.get('content-type') || '',
    };
  }

  static getResourceIdFromUrl(url: string) {
    if (process.env.APP_PLATFORM === 'electron') {
      if (!url.startsWith(appFileProtocol)) {
        return null;
      }

      const { pathname } = parseUrl(url);

      if (!pathname) {
        throw new Error(`invalid url ${url}`);
      }

      return path.basename(pathname);
    }

    return null;
  }
}
