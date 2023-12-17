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

export * from '@shared/domain/model/material/index.js';
