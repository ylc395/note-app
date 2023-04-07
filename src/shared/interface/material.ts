import { object, string, infer as Infer, union, instanceof as zodInstanceof } from 'zod';
import type { EntityId } from './entity';

export const materialDTOSchema = object({
  name: string().optional(),
  parentId: string().optional(),
  icon: string().optional(),
  content: object({
    data: union([string(), zodInstanceof(ArrayBuffer)]),
    mimeType: string().min(1),
  }).optional(),
});

export type MaterialDTO = Infer<typeof materialDTOSchema>;

export interface DirectoryVO {
  id: EntityId;
  name: string;
  icon: string | null;
  parentId: DirectoryVO['id'] | null;
  childrenCount: number;
}

export type EntityMaterialVO = Omit<DirectoryVO, 'childrenCount'> & {
  mimeType: string;
  sourceUrl: string | null;
  createdAt: number;
  updatedAt: number;
};

export type MaterialVO = DirectoryVO | EntityMaterialVO;

export interface MaterialQuery {
  parentId?: NonNullable<MaterialVO['parentId']>;
}

export const isDirectory = (entity: MaterialVO): entity is DirectoryVO => {
  return 'childrenCount' in entity;
};

export type TextMaterialBodyVO = string;

export interface TextMaterialCommentVO {
  position: number;
  content: string;
}
