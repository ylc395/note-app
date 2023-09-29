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
  position: string;
  text: string;
}

export interface FileText {
  records: FileTextRecord[];
  fileId: string;
}

export * from 'shard/model/file';
