import type { LoadedFile, LocalFile } from '@domain/model/file';

export const token = Symbol();

export interface FileReader {
  readRemoteFile: (url: string) => Promise<LoadedFile | null>;
  readLocalFile: (path: string) => Promise<LocalFile | null>;
  readDataUrl: (dataUrl: string) => Promise<LoadedFile | null>;
}
