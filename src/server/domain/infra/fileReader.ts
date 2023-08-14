import type { RemoteFile, LocalFile, File } from 'model/file';

export const token = Symbol();

export interface FileReader {
  readRemoteFile: (url: string) => Promise<RemoteFile | null>;
  readLocalFile: (path: string) => Promise<LocalFile | null>;
  readDataUrl: (dataUrl: string) => Promise<File | null>;
}
