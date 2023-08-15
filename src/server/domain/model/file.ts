import type { FileDTO, FileUrlDTO } from 'shard/model/file';

export const isFileUrl = (dto: FileDTO): dto is FileUrlDTO => 'url' in dto;

export interface File {
  mimeType: string;
  data: ArrayBuffer;
}

export type LocalFile = Pick<File, 'data'>;

export * from 'shard/model/file';
