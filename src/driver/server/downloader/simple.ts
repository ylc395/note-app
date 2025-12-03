import { Observable } from 'rxjs';
import { noop } from 'lodash-es';
import type { Downloader } from '#domain/server/infra/downloader';

// @types/jsdom 中引用了 lib.dom.d.ts，其中 ReadableStream 的定义是错的，导致全局 ReadableStream 被错误的定义覆盖
// 这里做个修复
declare global {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  interface ReadableStream<R = any> {
    [Symbol.asyncIterator](): AsyncIterator<R>;
  }
}

const simpleDownloader: Downloader = {
  download(url: string) {
    const abortController = new AbortController();

    return new Observable((subscriber) => {
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
  },
  getMetadata: async (url: string) => {
    function processResponse(res: Response) {
      if (res.ok) {
        const contentType = res.headers.get('Content-Type')?.split(';')[0]?.trim();
        const contentLength = res.headers.get('Content-Length');

        if (contentType) {
          return {
            isAccessible: true,
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

    if (metadata) {
      return metadata;
    }

    return {
      isAccessible: false,
      mimeType: null,
      size: null,
    };
  },
};

export default simpleDownloader;
