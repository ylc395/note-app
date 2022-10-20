export interface Material {
  id: number;
  name: string;
  comment: string;
  data: ArrayBuffer;
  mimeType: string;
  deviceName: string;
  sourceUrl: `file://${string}`;
  rating: number;
  createdAt: number;
  updatedAt: number;
}
