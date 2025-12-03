export interface File {
  id: string;
  data: ArrayBuffer;
  size: number;
  hash: string;
  lang: string[];
  mimeType: string;
  textUnitLength?: number; // 对于 PDF，指总页数
}

export interface RemoteFileMetadata {
  isAccessible: boolean;
  mimeType: File['mimeType'] | null;
  size: number | null;
}

/**
 * @api
 */
export interface FileDTO {
  mimeType: File['mimeType'];
  lang?: File['lang'];
  data: ArrayBuffer;
  name?: string;
  sourceUrl?: string;
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
    blocktype: number | string;
    paragraphs: Array<{
      is_ltr: 0 | 1 | boolean;
      lines: Array<{
        baseline: { x0: number; x1: number; y0: number; y1: number };
        bbox: { x0: number; x1: number; y0: number; y1: number };
        text: string;
        confidence: number;
        words: Array<{
          symbols: Array<{
            confidence: number;
            text: string;
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
