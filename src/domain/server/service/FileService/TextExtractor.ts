import type { InjectionToken } from 'tsyringe';
import type { FileTextRecord, File, TextLocation } from '@domain/server/model/file.js';

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

export interface TextExtractor {
  addJob: (job: Job) => void;
  onExtracted: (handler: (result: JobResult) => Promise<void>) => void; // 如果无法提取文本，不会触发这个回调
}

export const token: InjectionToken<TextExtractor> = Symbol();
