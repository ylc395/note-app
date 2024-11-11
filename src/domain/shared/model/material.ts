import dayjs from 'dayjs';
import type { Entity, EntityId, EntityParentId } from './entity.js';
import type { FileVO } from './file.js';

export interface Material {
  id: EntityId;
  title: string;
  icon: string | null;
  parentId: EntityParentId;
  createdAt: number;
  updatedAt: number;
}

export interface EntityMaterial extends Material {
  file: FileVO;
  body: string;
  sourceUrl: string | null;
}

/**
 * @api
 */
export type MaterialPatchDTO = Partial<Pick<EntityMaterial, 'title' | 'parentId' | 'icon' | 'sourceUrl' | 'body'>>;

/**
 * @api
 */
export type MaterialBatchPatchDTO = Pick<MaterialPatchDTO, 'parentId' | 'icon'>;

/**
 * @api
 */
export type MaterialDTO = MaterialPatchDTO & {
  fileId?: FileVO['id'];
};

/**
 * @api
 */
export interface ClientMaterialQuery {
  parentId?: EntityParentId | string[];
  fileHash?: string;
}

interface BaseVO {
  childrenCount: number;
  isStar: boolean;
}

export type MaterialVO = BaseVO & Material;

export type EntityMaterialVO = BaseVO & EntityMaterial;

export function isEntityMaterial(v: Material): v is EntityMaterial;
export function isEntityMaterial(v: MaterialVO): v is EntityMaterialVO;
export function isEntityMaterial(v: Material | MaterialVO): boolean;
export function isEntityMaterial(v: Material | MaterialVO) {
  return 'file' in v;
}

export function normalizeTitle(v: Material | MaterialVO | Entity) {
  return v.title || `未命名素材-${dayjs(v.createdAt).format('YYYYMMDD-HHmm')}`;
}
