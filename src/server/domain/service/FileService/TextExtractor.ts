import type { InjectionToken } from 'tsyringe';
import type { FileVO, NewFileTextRecord, TextLocation } from '@domain/model/file.js';

export interface Result extends NewFileTextRecord {
  isFinished: boolean;
}

export interface Job {
  fileId: FileVO['id'];
  mimeType: string;
  getData: (id: FileVO['id']) => Promise<ArrayBuffer | null>;
  lang: string;
  skipLocations?: TextLocation[];
}

export interface TextExtractor {
  addJob: (job: Job) => void;
  onExtracted: (cb: (result: Result) => Promise<void>) => void;
}

export const token: InjectionToken<TextExtractor> = Symbol();
