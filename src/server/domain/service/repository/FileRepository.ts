import type { FileVO, File, FileText, UnfinishedTextExtraction } from 'model/file';

export interface FileRepository {
  findOneById: (id: FileVO['id']) => Promise<FileVO | null>;
  findBlobById: (id: FileVO['id']) => Promise<ArrayBuffer | null>;
  batchCreate: (files: File[]) => Promise<FileVO[]>;
  createText: (fileText: FileText) => Promise<void>;
  haveText: (fileIds: FileVO['id'][]) => Promise<Record<FileVO['id'], boolean>>;
  markTextExtracted: (fileId: FileVO['id']) => Promise<void>;
  findTextUnextracted: (mimeTypes: string[]) => Promise<UnfinishedTextExtraction[]>;
}
