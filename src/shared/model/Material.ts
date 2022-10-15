type TagId = string;

export interface MaterialFile {
  path: string;
  mimeType: string;
}

export interface Material {
  mimeType: string;
  name: string;
  data: ArrayBuffer;
  tags?: TagId[];
  addedAt?: number;
  size?: number;
  source?: string;
}
