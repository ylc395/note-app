import { object, string, type infer as Infer, union } from 'zod';
import dayjs from 'dayjs';
import type { Entity, EntityId, EntityParentId } from './entity.js';

export const newMaterialDTOSchema = object({
  title: string().optional(),
  parentId: string().nullish(),
  icon: string().min(1).nullish(),
  fileId: string().optional(),
  sourceUrl: string().url().nullish(),
  comment: string().optional(),
});

export const materialPatchDTOSchema = newMaterialDTOSchema.omit({ fileId: true });

export const clientMaterialQuerySchema = object({
  parentId: union([string().nullable(), string().array()]).optional(),
  fileHash: string().optional(),
});

export interface Material {
  id: EntityId;
  title: string;
  icon: string | null;
  parentId: EntityParentId;
  createdAt: number;
  updatedAt: number;
}

export interface EntityMaterial extends Material {
  mimeType: string;
  comment: string;
  sourceUrl: string | null;
}

export enum MaterialTypes {
  Directory = 1,
  Entity,
}

export type NewMaterialDTO = Infer<typeof newMaterialDTOSchema>;
export type MaterialPatchDTO = Infer<typeof materialPatchDTOSchema>;

export interface MaterialVO extends Material {
  childrenCount: number;
  isStar: boolean;
}

export interface EntityMaterialVO extends MaterialVO {
  comment: string;
  sourceUrl: string;
  mimeType: string;
}

export type ClientMaterialQuery = Infer<typeof clientMaterialQuerySchema>;

export function isEntityMaterial(v: Material): v is EntityMaterial;
export function isEntityMaterial(v: MaterialVO): v is EntityMaterialVO;
export function isEntityMaterial(v: Material | MaterialVO): boolean;
export function isEntityMaterial(v: Material | MaterialVO) {
  return Boolean('mimeType' in v && v.mimeType);
}

export function normalizeTitle(v: Material | MaterialVO | Entity) {
  return v.title || `未命名${dayjs(v.createdAt).format('YYYYMMDD-HHmm')}`;
}
