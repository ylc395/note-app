export interface File {
  id: string;
  data: ArrayBuffer;
  size: number;
  hash: string;
  lang: string[];
  mimeType: string;
  isTemp: boolean;
  isTextExtracted?: boolean;
}

/**
 * @api
 */
export interface FileDTO {
  mimeType: File['mimeType'];
  isTemp?: boolean;
  lang?: File['lang'];
  data?: ArrayBuffer;
  path?: string;
}

/**
 * @api
 */
export type FileVO = Pick<File, 'id' | 'mimeType' | 'lang' | 'size' | 'hash' | 'isTemp'>;

export enum MimeTypes {
  PDF = 'application/pdf',
  HTML = 'text/html',
}

export interface TextLocation {
  page?: number;
  scale?: number;
  words?: {
    text: string;
    box: { x0: number; x1: number; y0: number; y1: number };
  }[];
}
