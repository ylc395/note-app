import type { FileVO } from 'model/file';
import type { File } from 'model/file';

export interface FileRepository {
  findOneById: (id: FileVO['id']) => Promise<FileVO | null>;
  findBlobById: (id: FileVO['id']) => Promise<ArrayBuffer | string | null>;
  batchCreate: (files: File[]) => Promise<FileVO[]>;
}
