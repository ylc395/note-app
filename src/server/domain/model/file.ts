export interface File {
  id?: string;
  data: ArrayBuffer;
  size: number;
  hash: string;
  lang: string;
  mimeType: string;
}

export interface TextLocation {
  page?: number;
  scale?: number;
  words?: {
    text: string;
    box: { x0: number; x1: number; y0: number; y1: number };
  }[];
}

export interface ExtractedFileTextRecord {
  locations: TextLocation[];
  fileId: string;
  fileCreatedAt: number;
  lang: string;
  mimeType: string;
}

export interface NewFileTextRecord {
  location: TextLocation;
  fileId: string;
  text: string;
}

export * from '@shared/domain/model/file.js';
