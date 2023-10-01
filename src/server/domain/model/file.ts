import type { FileDTO, FileUrlDTO, FileVO } from 'shard/model/file';

export const isFileUrl = (dto: FileDTO): dto is FileUrlDTO => 'url' in dto;

export interface LocalFile {
  data: ArrayBuffer;
}

export interface File extends LocalFile {
  mimeType: string;
}

export interface CreatedFile extends File {
  id: FileVO['id'];
}

export interface FileTextRecord {
  location: {
    page?: number;
    scale?: number;
    words?: {
      text: string;
      box: { x0: number; x1: number; y0: number; y1: number };
    }[];
  };
  text: string;
}

export interface FileText {
  records: FileTextRecord[];
  fileId: string;
}

export interface UnfinishedTextExtraction {
  fileId: CreatedFile['id'];
  mimeType: string;
  finished?: number[];
}

export * from 'shard/model/file';
