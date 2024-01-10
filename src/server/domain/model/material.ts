import type { Material, AnnotationVO, MaterialPatchDTO } from '@shared/domain/model/material/index.js';

export type NewMaterial = Omit<Partial<Material>, 'id'>;

export interface MaterialQuery {
  parentId?: Material['parentId'];
  id?: Material['id'][];
  isAvailable?: boolean;
}

export type Annotation = AnnotationVO & {
  materialId: Material['id'];
};

export type MaterialPatch = MaterialPatchDTO & { userUpdatedAt?: number; comment?: string };

export * from '@shared/domain/model/material/index.js';
