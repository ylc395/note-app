import type { File, FileVO, FileTextRecord } from '@domain/server/model/file.js';

export type FilePatch = Partial<Pick<File, 'isTextExtracted' | 'lang'>>;

export interface FileRepository {
  findOneById: (id: File['id']) => Promise<FileVO | null>;
  findOneByHash: (hash: string) => Promise<FileVO | null>;
  findBlobById: (id: File['id']) => Promise<ArrayBuffer | null>;
  create: (file: File) => Promise<FileVO>;
  updateOne: (id: File['id'], patch: FilePatch) => Promise<boolean>;
  createTextRecord: (fileText: FileTextRecord) => Promise<void>;
  findUnfinishedFile: () => Promise<FileVO[]>;
  findAllFileTextRecords: (ids: File['id'][]) => Promise<FileTextRecord[]>;
}
