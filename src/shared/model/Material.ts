type TagId = string;

export interface MaterialFile {
  path: string;
  mimeType: string;
}

export interface Material {
  type: string;
  name: string;
  file: ArrayBuffer;
  tags?: TagId[];
  addedAt?: number;
  size?: number;
  source?: string;
}
