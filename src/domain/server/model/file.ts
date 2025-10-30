import type { TextLocation, File } from '#domain/shared/model/file.js';

export interface FileTextRecord {
  fileId: string;
  location: TextLocation;
  text?: string; // 有时不关心文字记录的具体内容
  lang?: File['lang']; // 直接提取自文本，则语言不重要
}

export interface NewFileTextRecord extends FileTextRecord {
  text: string;
}

export * from '#domain/shared/model/file.js';
