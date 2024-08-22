import type { File, TextLocation } from '@domain/shared/model/file.js';

export interface FileTextRecord {
  fileId: string;
  location: TextLocation;
  text: string;
}

export type FilePatch = Partial<Pick<File, 'isTextExtracted' | 'lang'>>;

export * from '@domain/shared/model/file.js';
