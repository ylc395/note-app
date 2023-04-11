import { object, string, infer as Infer, instanceof as zodInstanceof } from 'zod';
import type { EntityId } from './entity';

export const materialDTOSchema = object({
  name: string().optional(),
  parentId: string().nullable().optional(),
  icon: string().optional(),
  file: object({
    name: string(),
    data: zodInstanceof(ArrayBuffer),
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
  return 'childrenCount' in entity;
};
