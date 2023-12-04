import type { FileVO, LoadedFile, FileText, UnfinishedTextExtraction } from '@domain/model/file';

export interface FileRepository {
  findOneById: (id: FileVO['id']) => Promise<FileVO | null>;
  findBlobById: (id: FileVO['id']) => Promise<ArrayBuffer | null>;
  batchCreate: (files: Required<LoadedFile>[]) => Promise<FileVO[]>;
  createText: (fileText: FileText) => Promise<void>;
  markTextExtracted: (fileId: FileVO['id']) => Promise<void>;
  findTextUnextracted: (mimeTypes: string[]) => Promise<UnfinishedTextExtraction[]>;
}
