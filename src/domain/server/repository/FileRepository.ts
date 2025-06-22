import type { File, FileVO, FileTextRecord } from '#domain/server/model/file.js';
import type { MaybeArray } from '#utils/collection';

export type FilePatch = Partial<Pick<File, 'lang'>>;

export interface Query {
  ids: File['id'][];
}

export interface FileRepository {
  findOneById: (id: File['id']) => Promise<FileVO | null>;
  findOneByHash: (hash: string) => Promise<FileVO | null>;
  findBlobById: (id: File['id']) => Promise<ArrayBuffer | null>;
  findAll: (q: Query) => Promise<FileVO[]>;
  create: (file: Required<File>) => Promise<FileVO>;
  updateOne: (id: File['id'], patch: FilePatch) => Promise<boolean>;
  createTextRecord: (fileText: FileTextRecord) => Promise<void>;
  findUnfinishedFile: (mimeTypes: string[]) => Promise<FileVO[]>;
  findAllFileTextRecords: (ids: MaybeArray<File['id']>) => Promise<FileTextRecord[]>;
}
