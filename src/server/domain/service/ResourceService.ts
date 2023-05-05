import { Inject, Injectable } from '@nestjs/common';
import { parse as parseUrl } from 'node:url';
import path from 'node:path';
import fromParis from 'lodash/fromPairs';

import { type ResourcesDTO, isUrls } from 'interface/resource';
import { appFileProtocol } from 'infra/electronProtocol';
import { token as downloaderToken, type Downloader } from 'infra/Downloader';

import { buildIndex } from 'utils/collection';

import BaseService from './BaseService';

@Injectable()
export default class ResourceService extends BaseService {
  @Inject(downloaderToken) private readonly downloader!: Downloader;
  async handleUpload(files: ResourcesDTO['files']) {
    if (isUrls(files)) {
      const existedFiles = buildIndex(await this.resources.findAll({ sourceUrl: files }), 'sourceUrl');
      const rawFiles = await Promise.all(
        files.map(async (url) => {
          const existedFile = existedFiles[url];

          if (existedFile) {
            return existedFile;
          }

          const rawFile = await this.downloader.downloadFile(url);

          return !rawFile ? url : this.resources.create(rawFile);
        }),
      );

      return rawFiles;
    } else {
      return this.resources.batchCreate(files);
    }
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
    const fileId = ResourceService.getResourceIdFromUrl(url);

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
