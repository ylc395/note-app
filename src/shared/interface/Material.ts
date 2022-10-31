import type { TagVO } from './Tag';

export interface MaterialDTO {
  name: string;
  comment?: string;
  rating?: number;
  fileId: number;
  tags?: TagVO['id'][];
}

export type MaterialVO = Required<MaterialDTO> & {
  id: number;
  createdAt: number;
  updatedAt: number;
};

export interface MaterialQuery {
  type?: MaterialTypes;
  tag?: TagVO['id'];
  sourceUrl?: string;
}

export enum MaterialTypes {
  HTML = 'html',
  Text = 'text',
  PDF = 'pdf',
}
