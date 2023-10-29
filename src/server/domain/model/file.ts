import type { FileVO } from 'shared/model/file';

export interface LocalFile {
  data: ArrayBuffer;
}

export interface LoadedFile {
  data: ArrayBuffer;
  lang?: string;
  mimeType: string;
}

export interface CreatedFile extends LoadedFile {
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
  finished?: number[];
}

export * from 'shared/model/file';
