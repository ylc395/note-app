import { parse as parseUrl } from 'node:url';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import fs from 'fs-extra';
import { Injectable, Inject, Logger } from '@nestjs/common';

import type { FileReader } from '@domain/infra/fileReader.js';
import type DesktopRuntime from '@domain/infra/DesktopRuntime.js';
import { token as runtimeToken } from '@domain/infra/DesktopRuntime.js';
import type { LoadedFile } from '@domain/model/file.js';

@Injectable()
export default class ElectronFileReader implements FileReader {
  private readonly cachePath: string;
  private readonly cacheIndexPath: string;
  private readonly logger: Logger;

  constructor(@Inject(runtimeToken) private readonly runtime: DesktopRuntime) {
    this.logger = new Logger(`${runtime.isMain() ? 'app' : 'http'} ${ElectronFileReader.name}`);
    this.cachePath = this.runtime.getPaths().fileCachePath;
    this.cacheIndexPath = path.join(this.cachePath, 'cache.index.json');
  }

  private static getFileNameFromUrl(url: string) {
    const { pathname } = parseUrl(url);

    if (!pathname) {
      throw new Error(`invalid url ${url}`);
    }

    return path.basename(pathname);
  }

  async readRemoteFile(url: string) {
    const cache = await this.getCache(url);

    if (cache) {
      return cache;
    }

    try {
      const res = await fetch(url);

      if (!res.ok) {
        return null;
      }

      const result = {
        mimeType: res.headers.get('content-type') || '',
        data: await res.arrayBuffer(),
      };

      this.writeCache(url, result);

      return result;
    } catch (e) {
      this.logger.log(e);
      return null;
    }
  }

  private async readCacheIndex() {
    const cacheIndex = (await fs.pathExists(this.cacheIndexPath)) ? await fs.readJSON(this.cacheIndexPath) : {};
    return cacheIndex;
  }

  private async getCache(url: string) {
    const cacheIndex = await this.readCacheIndex();

    if (cacheIndex[url]) {
      const { path: filePath, mimeType } = cacheIndex[url];
      const data = await fs.readFile(path.join(this.cachePath, filePath));
      const name = ElectronFileReader.getFileNameFromUrl(url);

      return { name, mimeType, data: data.buffer };
    }

    return null;
  }

  private async writeCache(url: string, { data, mimeType }: LoadedFile) {
    const cacheIndex = await this.readCacheIndex();
    const extName = path.extname(ElectronFileReader.getFileNameFromUrl(url));
    const cacheFileName = extName ? `${randomUUID()}${extName}` : randomUUID();

    cacheIndex[url] = { path: cacheFileName, mimeType };

    await fs.writeFile(path.join(this.cachePath, cacheFileName), Buffer.from(data));
    await fs.writeJSON(this.cacheIndexPath, cacheIndex);
  }

  async readLocalFile(filePath: string) {
    const data = await fs.readFile(filePath);

    return { data };
  }

  async readDataUrl(dataUrl: string) {
    const dataUrlPattern = /^data:(.+?)?(;base64)?,(.+)/;
    const matchResult = dataUrl.match(dataUrlPattern);

    if (!matchResult) {
      return null;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [_, mimeType, base64Flag, content] = matchResult;

    if (!content) {
      return null;
    }

    return {
      mimeType: mimeType || 'text/plain',
      data: base64Flag
        ? Buffer.from(content, 'base64').buffer
        : new TextEncoder().encode(decodeURIComponent(content)).buffer,
    };
  }
}
