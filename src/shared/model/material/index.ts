import { object, string, nativeEnum, preprocess, type infer as Infer } from 'zod';
import type { EntityId, EntityParentId } from '../entity';
import type { Starable } from '../star';

export const MaterialPatchDTOSchema = object({
  name: string().min(1).optional(),
  parentId: string().nullable().optional(),
  icon: string().min(1).optional(),
  fileId: string().optional(),
  sourceUrl: string().url().optional(),
});

export type MaterialPatchDTO = Infer<typeof MaterialPatchDTOSchema>;

export enum MaterialTypes {
  Directory = 1,
  Entity,
}

interface BaseMaterial {
  id: EntityId;
  name: string;
  icon: string | null;
  parentId: EntityParentId;
  createdAt: number;
  updatedAt: number;
}

export interface MaterialDirectory extends BaseMaterial {}

export interface MaterialEntity extends BaseMaterial {
  mimeType: string;
  sourceUrl: string | null;
}

export type Material = MaterialDirectory | MaterialEntity;

export interface MaterialDirectoryVO extends MaterialDirectory, Starable {
  childrenCount: number;
}

export interface MaterialEntityVO extends MaterialEntity, Starable {}

export type MaterialVO = MaterialDirectoryVO | MaterialEntityVO;

export const isDirectory = (entity: Material): entity is MaterialDirectoryVO => {
  return 'childrenCount' in entity;
};

export const isEntityMaterial = (entity: Material): entity is MaterialEntity => {
  return 'mimeType' in entity;
};

export const clientMaterialQuerySchema = object({
  parentId: string().nullable().optional(),
  type: preprocess((v) => v && Number(v), nativeEnum(MaterialTypes).optional()),
});

export type ClientMaterialQuery = Infer<typeof clientMaterialQuerySchema>;

export * from './annotation';
