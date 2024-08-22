import type { Material, MaterialPatch, MaterialQuery } from '@domain/server/model/material.js';
import type { FileVO } from '@domain/shared/model/file.js';

export interface MaterialRepository {
  create: (directory: Material) => Promise<Material>;
  update(id: Material['id'] | Material['id'][], material: MaterialPatch): Promise<boolean>;
  findAll: (query: MaterialQuery) => Promise<Material[]>;
  findFiles: (ids: Material['id'][]) => Promise<Record<Material['id'], FileVO>>;
  findOneById: (id: Material['id'], config?: { isAvailableOnly?: boolean }) => Promise<Material | null>;
  findBlobById: (id: Material['id'], config?: { isAvailableOnly?: boolean }) => Promise<ArrayBuffer | null>;
}
