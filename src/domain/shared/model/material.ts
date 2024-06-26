import dayjs from 'dayjs';
import type { Entity, EntityId, EntityParentId } from './entity.js';

/**
 * @api
 */
export interface MaterialDTO {
  title?: string;
  parentId?: EntityParentId;
  icon?: string | null;
  fileId?: string;
  sourceUrl?: string | null;
  comment?: string;
}

/**
 * @api
 */
export type MaterialPatchDTO = Omit<MaterialDTO, 'fileId'>;

/**
 * @api
 */
export interface ClientMaterialQuery {
  parentId?: EntityParentId | string[];
  fileHash?: string;
}

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

/**
 * @api
 */
export interface MaterialVO extends Material {
  childrenCount: number;
  isStar: boolean;
}

export interface EntityMaterialVO extends MaterialVO {
  comment: string;
  sourceUrl: string;
  mimeType: string;
}

export function isEntityMaterial(v: Material): v is EntityMaterial;
export function isEntityMaterial(v: MaterialVO): v is EntityMaterialVO;
export function isEntityMaterial(v: Material | MaterialVO): boolean;
export function isEntityMaterial(v: Material | MaterialVO) {
  return Boolean('mimeType' in v && v.mimeType);
}

export function normalizeTitle(v: Material | MaterialVO | Entity) {
  return v.title || `未命名${dayjs(v.createdAt).format('YYYYMMDD-HHmm')}`;
}
