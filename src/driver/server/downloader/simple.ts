import { Observable } from 'rxjs';
import type { Downloader } from '#domain/server/infra/downloader';

const simpleDownloader: Downloader = {
  download(url: string) {
    const abortController = new AbortController();

    return new Observable((subscriber) => {
      fetch(url, { signal: abortController.signal }).then(
        async (res) => {
          const mimeType = res.headers.get('Content-Type')?.split(';')[0]?.trim();

          if (!res.body || !mimeType) {
            subscriber.complete();
            return;
          }

          const metadata = {
            mimeType,
            size: res.headers.has('Content-Length') ? Number(res.headers.get('Content-Length')) : null,
          };

          subscriber.next(metadata);

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
};

export default simpleDownloader;
