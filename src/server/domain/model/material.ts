import dayjs from 'dayjs';
import type { MaterialVO, MaterialTypes, EntityMaterialVO } from 'shard/model/material';

export type Material = Omit<MaterialVO, 'isStar'>;

export type Directory = Material;

export type EntityMaterial = Omit<EntityMaterialVO, 'isStar'>;

export interface MaterialQuery {
  parentId?: MaterialVO['parentId'];
  id?: MaterialVO['id'][];
  type?: MaterialTypes;
}

export function normalizeTitle(v: Directory | EntityMaterial) {
  return v.name || `${isDirectory(v) ? '未命名目录' : '未命名素材'}${dayjs.unix(v.createdAt).format('YYYYMMDD-HHmm')}`;
}

export function isDirectory(m: Material): m is Directory {
  return !('mimeType' in m);
}

export function isEntityMaterial(m: Material): m is EntityMaterial {
  return !isDirectory(m);
}

export * from 'shard/model/material';
