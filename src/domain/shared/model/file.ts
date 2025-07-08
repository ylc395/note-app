export interface File {
  id: string;
  data: ArrayBuffer;
  size: number;
  hash: string;
  lang: string[];
  mimeType: string;
  textUnitLength?: number; // 对于 PDF，指总页数
}

/**
 * @api
 */
export interface FileDTO {
  mimeType: File['mimeType'];
  lang?: File['lang'];
  data?: ArrayBuffer;
  path?: string;
}

/**
 * @api
 */
export type FileVO = Pick<File, 'id' | 'mimeType' | 'lang' | 'size' | 'hash'>;

export enum MimeTypes {
  PDF = 'application/pdf',
  HTML = 'text/html',
}

/**
 * @api
 */
export interface TextLocation {
  page?: number;
  confidence?: number;
  blocks?: Array<{
    bbox: { x0: number; x1: number; y0: number; y1: number };
    blocktype: number | string;
    paragraphs: Array<{
      bbox: { x0: number; x1: number; y0: number; y1: number };
      is_ltr: 0 | 1 | boolean;
      lines: Array<{
        baseline: { x0: number; x1: number; y0: number; y1: number };
        bbox: { x0: number; x1: number; y0: number; y1: number };
        text: string;
        words: Array<{
          bbox: { x0: number; x1: number; y0: number; y1: number };
          symbols: Array<{
            bbox: { x0: number; x1: number; y0: number; y1: number };
            is_dropcap: 0 | 1 | boolean;
            is_subscript: 0 | 1 | boolean;
            is_superscript: 0 | 1 | boolean;
          }>;
        }>;
      }>;
    }>;
  }>;
}
