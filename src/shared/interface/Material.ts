import type { TagVO } from './Tag';
import { object, string, number, array, type infer as Infer } from 'zod';

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

export const materialDTOSchema = object({
  name: string().min(1, '资料名不能为空'),
  comment: string().optional(),
  rating: number().optional(),
  fileId: number(),
  tags: number().array().optional(),
});

export const materialsDTOSchema = array(materialDTOSchema);

export type MaterialDTO = Infer<typeof materialDTOSchema>;

export type MaterialVO = Required<MaterialDTO> & {
  id: number;
  createdAt: number;
  updatedAt: number;
};
