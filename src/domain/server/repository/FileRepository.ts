import type { File, FileVO, FileTextRecord, FilePatch } from '@domain/server/model/file.js';

export interface FileRepository {
  findOneById: (id: File['id']) => Promise<FileVO | null>;
  findOneByHash: (hash: string) => Promise<FileVO | null>;
  findBlobById: (id: File['id']) => Promise<ArrayBuffer | null>;
  create: (file: File) => Promise<FileVO>;
  updateOne: (id: File['id'], patch: FilePatch) => Promise<boolean>;
  createTextRecord: (fileText: FileTextRecord) => Promise<void>;
  findUnfinishedFile: () => Promise<FileVO[]>;
  findAllTextRecordLocations: (ids: File['id'][]) => Promise<FileTextRecord[]>;
}
