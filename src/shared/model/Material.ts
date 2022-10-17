type TagId = string;

export const UNKNOWN_MIME_TYPE = 'unknown';

export interface RawMaterial {
  url: string;
  mimeType: string;
  deviceName?: string;
}

export interface Material {
  mimeType: string;
  name: string;
  data: ArrayBuffer;
  tags?: TagId[];
  addedAt?: number;
  size?: number;
  sourceUrl: string;
  deviceName?: string;
}
