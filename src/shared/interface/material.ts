import { object, string, infer as Infer, instanceof as zodInstanceof, array, number } from 'zod';
import type { EntityId } from './entity';

export const materialDTOSchema = object({
  name: string().min(1).optional(),
  parentId: string().nullable().optional(),
  icon: string().min(1).optional(),
  file: object({
    name: string().min(1),
    data: zodInstanceof(ArrayBuffer).optional(),
    path: string().optional(),
    mimeType: string().min(1),
  }).optional(),
  sourceUrl: string().url().optional(),
  text: string().min(1).optional(),
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

export const materialQuerySchema = object({
  parentId: string().optional(),
});

export type MaterialQuery = Infer<typeof materialQuerySchema>;

export const isDirectory = (entity: MaterialVO): entity is DirectoryVO => {
  return !('mimeType' in entity);
};

export function normalizeTitle(material: MaterialVO) {
  if (material.name) {
    return material.name;
  }

  if (isDirectory(material)) {
    return '未命名目录';
  }

  if (material.mimeType.startsWith('image')) {
    return '未命名图片';
  }

  return '未命名文件';
}

export const HighlightDTOSchema = object({
  content: string(),
  color: string(),
  fragments: array(
    object({
      page: number(),
      rect: object({
        x: number(),
        y: number(),
        height: number(),
        width: number(),
      }),
    }),
  ),
});

export type HighlightDTO = Infer<typeof HighlightDTOSchema>;

export interface HighlightVO extends HighlightDTO {
  id: EntityId;
  comment: string | null;
  icon: string | null;
  updatedAt: number;
  createdAt: number;
}
