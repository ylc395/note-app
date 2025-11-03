import type { Token } from '#utils/singletonContainer';

export interface ImageResizer {
  resize: (params: { width: number; height: number; image: ArrayBuffer; mimeType: string }) => Promise<ArrayBuffer>;
  getSize: (image: ArrayBuffer) => Promise<{ width: number; height: number }>;
}

export const token: Token<ImageResizer> = Symbol('ImageResizer');
