type TagId = string;

enum MaterialType {
  Pdf,
  Audio,
  Video,
}

export interface Material {
  tags: TagId[];
  type: MaterialType;
  name: string;
  addedAt: number;
  size: number;
  source: string;
  file: ArrayBuffer;
}
