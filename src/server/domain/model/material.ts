import dayjs from 'dayjs';
import type {
  Material,
  MaterialTypes,
  AnnotationVO,
  MaterialPatchDTO,
  MaterialDirectory,
  MaterialEntity,
} from 'shard/model/material';

export type NewMaterialDirectory = Partial<MaterialDirectory>;
export type NewMaterialEntity = Partial<MaterialEntity> & { fileId: string };

export interface MaterialQuery {
  parentId?: Material['parentId'];
  id?: Material['id'][];
  type?: MaterialTypes;
}

export type Annotation = AnnotationVO & {
  materialId: Material['id'];
};

export type MaterialPatch = MaterialPatchDTO & { userUpdatedAt?: number };

export const isEntityMaterial = (entity: Material): entity is MaterialEntity => {
  return 'mimeType' in entity;
};

export const isDirectory = (entity: Material): entity is MaterialDirectory => {
  return !isEntityMaterial(entity);
};

export function normalizeTitle(v: Material) {
  return v.name || `${isDirectory(v) ? '未命名目录' : '未命名素材'}${dayjs.unix(v.createdAt).format('YYYYMMDD-HHmm')}`;
}

export * from 'shard/model/material';
