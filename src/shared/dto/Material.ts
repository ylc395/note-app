import type { TagVO } from './Tag';

export interface MaterialDTO {
  name: string;
  comment?: string;
  rating?: number;
  fileId: number;
  tags?: TagVO['id'][];
}

export type MaterialVO = Required<Omit<MaterialDTO, 'tags'>> & {
  id: number;
  createdAt: number;
  updatedAt: number;
  tags?: TagVO[];
};
