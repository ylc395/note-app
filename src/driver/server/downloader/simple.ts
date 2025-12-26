import { Observable } from 'rxjs';
import { noop } from 'lodash-es';
import { SAXParser } from 'parse5-sax-parser';
import { Readable } from 'node:stream';
import { ReadableStream } from 'node:stream/web';

import type { Downloader } from '#domain/server/infra/downloader';
import { toText } from '#utils/file';
import { inline } from './inlineHtml';

// @types/jsdom 中引用了 lib.dom.d.ts，其中 ReadableStream 的定义是错的，导致全局 ReadableStream 被错误的定义覆盖
// 这里仅对 response.body 做个修复
declare global {
  interface Response {
    body: ReadableStream<Uint8Array<ArrayBuffer>> | null;
  }
}

function download(url: string) {
  const abortController = new AbortController();

  return new Observable<Uint8Array>((subscriber) => {
    fetch(url, { signal: abortController.signal }).then(
      async (res) => {
        if (!res.body) {
          subscriber.complete();
          return;
        }

        try {
          for await (const chunk of res.body) {
            subscriber.next(chunk);
          }
        } catch {
          subscriber.complete();
          return;
        }

        subscriber.complete();
      },
      (e) => {
        subscriber.error(e);
      },
    );

    return () => {
      abortController.abort();
    };
  });
}

async function getMetadata(url: string) {
  function processResponse(res: Response) {
    if (res.ok) {
      const contentType = res.headers.get('Content-Type')?.split(';')[0]?.trim();
      const contentLength = res.headers.get('Content-Length');

      if (contentType) {
        return {
          mimeType: contentType,
          size: contentLength ? Number(contentLength) : null,
        };
      }
    }

    return null;
  }

  let metadata;

  try {
    const headRes = await fetch(url, { method: 'HEAD' });
    metadata = processResponse(headRes);

    if (metadata) {
      return metadata;
    }
  } catch {
    noop();
  }

  const ctl = new AbortController();

  try {
    const getRes = await fetch(url, { signal: ctl.signal });
    metadata = processResponse(getRes);
  } catch (error) {
    noop();
  }

  ctl.abort();

  if (!metadata) {
    throw new Error('can not get metadata');
  }

  return metadata;
}

async function inlineHtml(htmlText: ArrayBuffer | string, url: string) {
  htmlText = typeof htmlText === 'string' ? htmlText : toText(htmlText);
  const result = await inline(htmlText, url);

  return result;
}

async function getIcon(url: string): Promise<ArrayBuffer | null> {
  const res = await fetch(url);
  let iconUrl: string | null | undefined;

  if (res.ok && res.headers.get('Content-Type')?.includes('text/html')) {
    const parser = new SAXParser();

    iconUrl = await new Promise<string | null>((resolve) => {
      if (!res.body) {
        resolve(null);
        return;
      }

      parser.on('startTag', ({ tagName, attrs }) => {
        if (tagName.toLowerCase() === 'link') {
          const isLinkAttr = attrs.some((attr) => attr.name === 'rel' && attr.value.includes('icon'));
          const href = isLinkAttr && attrs.find((attr) => attr.name === 'href')?.value;

          if (href) {
            resolve(new URL(href, url).toString());
          }
        }
      });

      parser.on('endTag', ({ tagName }) => {
        if (tagName.toLowerCase() === 'head') {
          resolve(null);
        }
      });

      Readable.fromWeb(res.body, { encoding: 'utf-8' })
        .on('close', () => resolve(null))
        .pipe(parser);
    });

    parser.destroy();
  }

  if (iconUrl) {
    const iconRes = await fetch(iconUrl);

    if (iconRes.ok && iconRes.headers.get('Content-Type')?.startsWith('image')) {
      return iconRes.arrayBuffer();
    }
  }

  const faviconRes = await fetch(new URL('/favicon.ico', url));

  if (faviconRes.ok && faviconRes.headers.get('Content-Type')?.startsWith('image')) {
    return faviconRes.arrayBuffer();
  }

  return null;
}

const simpleDownloader: Downloader = {
  download,
  getMetadata,
  inlineHtml,
  getIcon,
};

export default simpleDownloader;
