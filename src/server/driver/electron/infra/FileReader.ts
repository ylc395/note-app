import { parse as parseUrl } from 'node:url';
import path from 'node:path';
import { readFile } from 'fs-extra';
import { Injectable } from '@nestjs/common';

import type { FileReader } from 'infra/fileReader';

// remove this once native fetch type is launched in @types/node
// see https://github.com/DefinitelyTyped/DefinitelyTyped/issues/60924#issuecomment-1358424866
declare global {
  export const { fetch, FormData, Headers, Request, Response }: typeof import('undici');
}

@Injectable()
export default class ElectronFileReader implements FileReader {
  async readRemoteFile(url: string) {
    const { pathname } = parseUrl(url);

    if (!pathname) {
      throw new Error(`invalid url ${url}`);
    }

    try {
      const name = path.basename(pathname);
      const res = await fetch(url);

      if (!res.ok) {
        return null;
      }

      return {
        name,
        size: Number(res.headers.get('content-length')),
        mimeType: res.headers.get('content-type') || '',
        data: await res.arrayBuffer(),
      };
    } catch {
      return null;
    }
  }

  async readLocalFile(filePath: string) {
    const name = path.basename(filePath);
    const data = await readFile(filePath);

    return { data, name };
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
      name: '',
      mimeType: mimeType || 'text/plain',
      data: base64Flag
        ? Buffer.from(content, 'base64').buffer
        : new TextEncoder().encode(decodeURIComponent(content)).buffer,
    };
  }
}
