import type { File } from 'model/file';

export const token = Symbol();

export interface Downloader {
  downloadFile: (url: string) => Promise<File | null>;
}
