import dayjs from 'dayjs';
import type { Material, EntityMaterial } from './base.js';
import type { MaterialVO, EntityMaterialVO } from './vo.js';

export function isEntityMaterial(v: Material): v is EntityMaterial;
export function isEntityMaterial(v: MaterialVO): v is EntityMaterialVO;
export function isEntityMaterial(v: Material | MaterialVO): boolean;
export function isEntityMaterial(v: Material | MaterialVO) {
  return Boolean('mimeType' in v && v.mimeType);
}

export function normalizeTitle(v: Material | MaterialVO) {
  return v.title || `未命名${isEntityMaterial(v) ? '素材' : '目录'}${dayjs(v.createdAt).format('YYYYMMDD-HHmm')}`;
}

export * from './base.js';
export * from './dto.js';
export * from './vo.js';
export * from './query.js';
export * from './annotation.js';
