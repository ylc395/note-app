import { parse as parseUrl } from 'node:url';
import path from 'node:path';
import { readFile } from 'fs-extra';
import { Injectable } from '@nestjs/common';

// remove this once native fetch type is launched in @types/node
// see https://github.com/DefinitelyTyped/DefinitelyTyped/issues/60924#issuecomment-1358424866
declare global {
  export const { fetch, FormData, Headers, Request, Response }: typeof import('undici');
}

@Injectable()
export default class Downloader {
  async downloadFile(url: string) {
    const { pathname, protocol } = parseUrl(url);

    if (!pathname) {
      throw new Error(`invalid url ${url}`);
    }

    if (protocol === 'files:') {
      return this.readLocalFile(pathname);
    }

    try {
      const name = path.basename(pathname);
      const res = await fetch(url);

      return { name, mimeType: res.headers.get('content-type') || '', data: await res.arrayBuffer() };
    } catch {
      return null;
    }
  }

  private async readLocalFile(filePath: string) {
    const name = path.basename(filePath);
    const data = await readFile(filePath);

    return { data, name, mimeType: '' };
  }
}
