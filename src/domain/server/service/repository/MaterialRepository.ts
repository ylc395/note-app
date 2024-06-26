import type { MaterialQuery, MaterialPatch, MaterialDTO, Material } from '@domain/server/model/material.js';

export interface MaterialRepository {
  create: (directory: MaterialDTO) => Promise<Material>;
  update(id: Material['id'] | Material['id'][], material: MaterialPatch): Promise<boolean>;
  findAll: (query: MaterialQuery) => Promise<Material[]>;
  findOneById: (id: Material['id'], availableOnly?: boolean) => Promise<Material | null>;
  findBlobById: (id: Material['id']) => Promise<ArrayBuffer | null>;
}
