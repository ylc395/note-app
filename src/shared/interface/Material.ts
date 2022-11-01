import type { TagVO } from './Tag';
import { object, string, number, nonempty, optional, array, type Describe } from 'superstruct';

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

export const materialDTOSchema: Describe<MaterialDTO[]> = array(
  object({
    name: nonempty(string()),
    comment: optional(string()),
    rating: optional(number()),
    fileId: number(),
    tags: optional(array(number())),
  }),
);
