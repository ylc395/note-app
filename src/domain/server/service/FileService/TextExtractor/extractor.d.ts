import type { File, FileTextRecord, TextLocation } from '#domain/server/model/file.js';
import type { ObservableInput } from 'rxjs';

export interface Job {
  fileId: File['id'];
  mimeType: File['mimeType'];
  getData: (id: File['id']) => Promise<ArrayBuffer | null>;
  lang: string[];
  locationsToSkip?: TextLocation[];
  onExtract: (result: Required<FileTextRecord>) => void; // 同一个 Job 中，该回调可能被多次调用。例如对于 PDF 文件，每一页都会被调用一次
}

export type ExtractResult = Pick<Required<FileTextRecord>, 'location' | 'text'>;

// 一个 TextExtractor 不与任何一个二进制数据绑定
export interface TextExtractor {
  getTextUnitLength: (data: ArrayBuffer) => Promise<number>;
  extract: (params: { data: ArrayBuffer; locationsToSkip?: Job['locationsToSkip'] }) => ObservableInput<ExtractResult>;
  destroy?: () => void;
}
