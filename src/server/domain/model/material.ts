import type { Material, MaterialPatchDTO } from '@shared/domain/model/material.js';

export type NewMaterial = Omit<Partial<Material>, 'id'>;

export interface MaterialQuery {
  parentId?: Material['parentId'] | Material['id'][];
  id?: Material['id'][];
  fileHash?: string;
  isAvailable?: boolean;
}

export type MaterialPatch = MaterialPatchDTO & { updatedAt?: number; comment?: string };

export * from '@shared/domain/model/material.js';
