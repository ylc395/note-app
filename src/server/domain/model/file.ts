import type { FileDTO, FileUrlDTO } from 'shard/model/file';

export const isFileUrl = (dto: FileDTO): dto is FileUrlDTO => 'url' in dto;

export interface File {
  name: string;
  mimeType: string;
  data: ArrayBuffer | string;
}

export * from 'shard/model/file';
