import { parse as parseUrl } from 'node:url';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { readFile, writeFile, readJSON, writeJSON, pathExists } from 'fs-extra';
import { Injectable, Inject, Logger } from '@nestjs/common';

import type { FileReader } from 'infra/fileReader';
import type Runtime from 'infra/Runtime';
import { token as runtimeToken } from 'infra/Runtime';
import type { File } from 'model/file';

// remove this once native fetch type is launched in @types/node
// see https://github.com/DefinitelyTyped/DefinitelyTyped/issues/60924#issuecomment-1358424866
declare global {
  export const { fetch, FormData, Headers, Request, Response }: typeof import('undici');
}

@Injectable()
export default class ElectronFileReader implements FileReader {
  private readonly cachePath: string;
  private readonly cacheIndexPath: string;
  private readonly logger: Logger;

  constructor(@Inject(runtimeToken) private readonly runtime: Runtime) {
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
    const cacheIndex = (await pathExists(this.cacheIndexPath)) ? await readJSON(this.cacheIndexPath) : {};
    return cacheIndex;
  }

  private async getCache(url: string) {
    const cacheIndex = await this.readCacheIndex();

    if (cacheIndex[url]) {
      const { path: filePath, mimeType } = cacheIndex[url];
      const data = await readFile(path.join(this.cachePath, filePath));
      const name = ElectronFileReader.getFileNameFromUrl(url);

      return { name, mimeType, data: data.buffer };
    }

    return null;
  }

  private async writeCache(url: string, { data, mimeType }: File) {
    const cacheIndex = await this.readCacheIndex();
    const extName = path.extname(ElectronFileReader.getFileNameFromUrl(url));
    const cacheFileName = extName ? `${randomUUID()}${extName}` : randomUUID();

    cacheIndex[url] = { path: cacheFileName, mimeType };

    await writeFile(path.join(this.cachePath, cacheFileName), Buffer.from(data));
    await writeJSON(this.cacheIndexPath, cacheIndex);
  }

  async readLocalFile(filePath: string) {
    const data = await readFile(filePath);

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
