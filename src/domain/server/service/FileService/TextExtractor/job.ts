import type { FileTextRecord, File, TextLocation } from '#domain/server/model/file.js';

export interface Job {
  fileId: File['id'];
  mimeType: File['mimeType'];
  getData: (id: File['id']) => Promise<ArrayBuffer | null>;
  lang: string[];
  locationsToSkip?: TextLocation[];
}

export interface JobResult extends FileTextRecord {
  isFinished: boolean;
}
