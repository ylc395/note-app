import type { File, LocalFile } from 'model/file';

export const token = Symbol();

export interface FileReader {
  readRemoteFile: (url: string) => Promise<File | null>;
  readLocalFile: (path: string) => Promise<LocalFile | null>;
  readDataUrl: (dataUrl: string) => Promise<File | null>;
}
