import type { TextLocation } from '@domain/shared/model/file.js';

export interface FileTextRecord {
  fileId: string;
  location: TextLocation;
  text: string;
}

export * from '@domain/shared/model/file.js';
