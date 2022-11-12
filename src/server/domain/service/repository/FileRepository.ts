import type { InjectionToken } from '@nestjs/common';
import type { File } from 'model/File';

export const token: InjectionToken = Symbol('FileRepository');

export interface FileQuery {
  id?: number;
  hash?: string;
}

export interface FileRepository {
  create: (file: File) => Promise<NonNullable<File['id']>>;
  findOne: (query: FileQuery) => Promise<Omit<File, 'data'> | undefined>;
  updateTextContent: (id: NonNullable<File['id']>, text: string) => Promise<void>;
  findData: (query: FileQuery) => Promise<ArrayBuffer | undefined>;
}
