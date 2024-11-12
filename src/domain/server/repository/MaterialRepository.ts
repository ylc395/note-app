import type { Material, MaterialPatchDTO, ClientMaterialQuery } from '#domain/shared/model/material.js';
import type { FileVO } from '#domain/shared/model/file.js';

export interface MaterialQuery extends ClientMaterialQuery {
  id?: Material['id'][];
  isAvailableOnly?: boolean;
}

export type MaterialPatch = MaterialPatchDTO & Partial<Pick<Material, 'updatedAt'>>;

export interface MaterialRepository {
  create: (directory: Material) => Promise<Material>;
  update(id: Material['id'] | Material['id'][], material: MaterialPatch): Promise<boolean>;
  findAll: (query: MaterialQuery) => Promise<Material[]>;
  findFiles: (ids: Material['id'][]) => Promise<Record<Material['id'], FileVO>>;
  findOneById: (id: Material['id'], config?: { isAvailableOnly?: boolean }) => Promise<Material | null>;
  findBlobById: (id: Material['id'], config?: { isAvailableOnly?: boolean }) => Promise<ArrayBuffer | null>;
}
