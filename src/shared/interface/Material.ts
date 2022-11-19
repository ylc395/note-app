import { object, string, number, array, type infer as Infer } from 'zod';
import type { FileVO } from './File';
import type { TagVO } from './Tag';

export interface MaterialQuery {
  tag?: TagVO['id'];
  sourceUrl?: string;
  id?: MaterialVO['id'][];
}

export const materialDTOSchema = object({
  name: string().min(1, '资料名不能为空'),
  comment: string().optional(),
  rating: number().optional(),
  fileId: number().optional(),
  tags: number().array().optional(),
});

export const materialsDTOSchema = array(materialDTOSchema);

export type MaterialDTO = Infer<typeof materialDTOSchema>;

export type MaterialVO = {
  id: number;
  name: string;
  comment: string;
  rating: number;
  file?: FileVO;
  document?: unknown;
  tags: TagVO[];
  createdAt: number;
  updatedAt: number;
};
