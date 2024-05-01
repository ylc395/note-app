import type { Material, MaterialPatchDTO } from '@domain/shared/model/material.js';

export type NewMaterial = Omit<Partial<Material>, 'id'>;

export interface MaterialQuery {
  parentId?: Material['parentId'] | Material['id'][];
  id?: Material['id'][];
  fileHash?: string;
  isAvailable?: boolean;
}

export type MaterialPatch = MaterialPatchDTO & { updatedAt?: number; comment?: string };

export * from '@domain/shared/model/material.js';
