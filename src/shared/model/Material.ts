import type { File } from './File';

export interface Material {
  id: number;
  name: string;
  comment: string;
  rating: number;
  createdAt: number;
  updatedAt: number;
  file?: File;
}
