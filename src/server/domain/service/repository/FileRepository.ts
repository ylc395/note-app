import type { FileVO } from 'interface/File';

export type FileQuery = {
  sourceUrl: NonNullable<FileVO['sourceUrl']>[];
};

export type RawFile = Pick<FileVO, 'name' | 'mimeType'> & {
  data: ArrayBuffer;
  sourceUrl?: string;
};

export interface FileRepository {
  findAll: (query: FileQuery) => Promise<FileVO[]>;
  findOneById: (id: FileVO['id']) => Promise<FileVO | null>;
  batchCreate: (files: RawFile[]) => Promise<FileVO[]>;
  create: (file: RawFile) => Promise<FileVO>;
  findFileDataById: (id: FileVO['id']) => Promise<{ mimeType: FileVO['mimeType']; data: ArrayBuffer } | null>;
}
