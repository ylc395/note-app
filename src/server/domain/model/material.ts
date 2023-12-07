import dayjs from 'dayjs';
import type {
  Material,
  MaterialTypes,
  AnnotationVO,
  MaterialPatchDTO,
  MaterialDirectory,
  MaterialEntity,
} from '@shared/domain/model/material/index.js';

export type NewMaterialDirectory = Partial<MaterialDirectory>;
export type NewMaterialEntity = Partial<MaterialEntity> & { fileId: string };

export interface MaterialQuery {
  parentId?: Material['parentId'];
  id?: Material['id'][];
  type?: MaterialTypes;
  isAvailable?: boolean;
}

export type Annotation = AnnotationVO & {
  materialId: Material['id'];
};

export type MaterialPatch = MaterialPatchDTO & { userUpdatedAt?: number; comment?: string };

export const isEntityMaterial = (entity: Material): entity is MaterialEntity => {
  return 'mimeType' in entity;
};

export const isDirectory = (entity: Material): entity is MaterialDirectory => {
  return !isEntityMaterial(entity);
};

export function normalizeEntityTitle(v: Pick<Material, 'createdAt'>) {
  return `未命名素材${dayjs(v.createdAt).format('YYYYMMDD-HHmm')}`;
}

export function normalizeTitle(v: Material) {
  return (
    v.title || (isDirectory(v) ? `未命名目录${dayjs(v.createdAt).format('YYYYMMDD-HHmm')}` : normalizeEntityTitle(v))
  );
}

export * from '@shared/domain/model/material/index.js';
