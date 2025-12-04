import type { Observable } from 'rxjs';
import type { Token } from '#utils/singletonContainer';
import type { RemoteFileMetadata } from '../model/file';

export interface Downloader {
  download: (url: string) => Observable<Uint8Array>;
  getMetadata: (url: string) => Promise<RemoteFileMetadata>;
  inlineHtml: (html: string, url: string) => Promise<string>;
}

export const token: Token<Downloader> = Symbol('downloader');
