import type { Observable } from 'rxjs';
import type { Token } from '#utils/singletonContainer';
import type { RemoteFileMetadata } from '../model/file';

export interface Downloader {
  download: (url: string) => Observable<RemoteFileMetadata | Uint8Array>;
}

export const token: Token<Downloader> = Symbol('downloader');
