import type { InjectionToken } from 'tsyringe';
import type { NewFileTextRecord, TextLocation } from '@domain/server/model/file.js';
import type { FileVO } from '@domain/shared/model/file.js';

export interface Result extends NewFileTextRecord {
  isFinished: boolean;
}

export interface Job {
  fileId: FileVO['id'];
  mimeType: string;
  getData: (id: FileVO['id']) => Promise<ArrayBuffer | null>;
  lang: string[];
  skipLocations?: TextLocation[];
}

export interface TextExtractor {
  addJob: (job: Job) => void;
  onExtracted: (cb: (result: Result) => Promise<void>) => void;
}

export const token: InjectionToken<TextExtractor> = Symbol();
