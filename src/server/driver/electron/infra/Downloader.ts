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

    if (protocol === 'file:') {
      return this.readLocalFile(pathname);
    }

    if (protocol === 'data') {
      return this.downloadDataUrl(url);
    }

    try {
      const name = path.basename(pathname);
      const res = await fetch(url);

      return { sourceUrl: url, name, mimeType: res.headers.get('content-type') || '', data: await res.arrayBuffer() };
    } catch {
      return null;
    }
  }

  private async readLocalFile(filePath: string) {
    const name = path.basename(filePath);
    const data = await readFile(filePath);

    return { data, name, mimeType: '' };
  }

  private downloadDataUrl(dataUrl: string) {
    const dataUrlPattern = /^data:(.+?)?(;base64)?,(.+)/;
    const matchResult = dataUrl.match(dataUrlPattern);

    if (!matchResult) {
      return null;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [_, mimeType, base64Flag, content] = matchResult;

    if (!content) {
      return dataUrl;
    }

    return {
      name: '',
      mimeType: mimeType || 'text/plain',
      data: base64Flag
        ? Buffer.from(content, 'base64').buffer
        : new TextEncoder().encode(decodeURIComponent(content)).buffer,
    };
  }
}
