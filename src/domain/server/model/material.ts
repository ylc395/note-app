import type { Material, MaterialPatchDTO, ClientMaterialQuery } from '@domain/shared/model/material.js';

export interface MaterialQuery extends ClientMaterialQuery {
  id?: Material['id'][];
  isAvailableOnly?: boolean;
}

export type MaterialPatch = MaterialPatchDTO & Partial<Pick<Material, 'updatedAt'>>;

export * from '@domain/shared/model/material.js';
