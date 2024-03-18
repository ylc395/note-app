import type { FileVO, File, ExtractedFileTextRecord, NewFileTextRecord } from '@domain/model/file.js';

export interface FileRepository {
  findOneById: (id: FileVO['id']) => Promise<FileVO | null>;
  findOneByHash: (hash: string) => Promise<FileVO | null>;
  findBlobById: (id: FileVO['id']) => Promise<ArrayBuffer | null>;
  create: (file: File) => Promise<FileVO>;
  createText: (fileText: NewFileTextRecord) => Promise<void>;
  markTextExtracted: (fileId: FileVO['id']) => Promise<void>;
  findTextExtractedLocationOfUnfinished: () => Promise<ExtractedFileTextRecord[]>;
}
