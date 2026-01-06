import type { ObservableInput } from 'rxjs';
import type { File, NewFileTextRecord, TextLocation } from '#domain/server/model/file.js';

export interface Job {
  fileId: File['id'];
  textExtractor: TextExtractor | (() => TextExtractor | null);
  getData: (id: File['id']) => Promise<ArrayBuffer | null>;
  locationsToSkip?: TextLocation[];
  onExtract: (result: NewFileTextRecordFileTextRecord) => void; // 同一个 Job 中，该回调可能被多次调用。例如对于 PDF 文件，每一页都会被调用一次
}

export type ExtractResult = Pick<NewFileTextRecord, 'location' | 'text' | 'lang'>;

// 一个 TextExtractor 不与任何一个二进制数据绑定，这样我们能用一个 extractor 处理多个二进制数据
export interface TextExtractor {
  getTextUnitLength: (data: ArrayBuffer) => Promise<number>;
  extract: (params: { data: ArrayBuffer; locationsToSkip?: Job['locationsToSkip'] }) => ObservableInput<ExtractResult>;
  destroy?: () => void;
}
