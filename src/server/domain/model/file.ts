import type { FileDTO, FileUrlDTO } from 'shard/model/file';

export const isFileUrl = (dto: FileDTO): dto is FileUrlDTO => 'url' in dto;

export interface File {
  name: string;
  mimeType: string;
  data: ArrayBuffer;
}

export interface RemoteFile extends File {
  data: ArrayBuffer;
  size: number;
}

export interface LocalFile {
  name: string;
  data: ArrayBuffer;
}

export * from 'shard/model/file';
