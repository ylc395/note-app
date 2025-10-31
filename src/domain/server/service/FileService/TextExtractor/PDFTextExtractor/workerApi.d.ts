import type { ExtractResult } from '../extractor';

export default interface Api {
  init: (doc: ArrayBuffer) => Promise<void>;
  extract: (pages: number[], onExtract: (result: ExtractResult) => void, onComplete: () => void) => void;
  getTextContent: (page: number) => Promise<ExtractResult>;
  getPageImage: (page: number) => Promise<{ data: Uint8Array; scale: number }>;
  getPagesCount: () => Promise<number>;
  destroy: () => Promise<void>;
}
