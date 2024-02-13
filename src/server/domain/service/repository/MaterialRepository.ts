import type { NewMaterialDTO, Material, MaterialQuery, MaterialPatch } from '@domain/model/material.js';

export interface MaterialRepository {
  create: (directory: NewMaterialDTO) => Promise<Material>;
  update(id: Material['id'] | Material['id'][], material: MaterialPatch): Promise<boolean>;
  findAll: (query: MaterialQuery) => Promise<Material[]>;
  findChildrenIds: (
    ids: Material['id'][],
    options?: { isAvailableOnly?: boolean },
  ) => Promise<Record<Material['id'], Material['id'][]>>;
  findDescendantIds: (materialIds: Material['id'][]) => Promise<Record<Material['id'], Material['id'][]>>;
  findAncestorIds: (materialIds: Material['id'][]) => Promise<Record<Material['id'], Material['id'][]>>;
  findOneById: (id: Material['id'], availableOnly?: boolean) => Promise<Material | null>;
  findBlobById: (id: Material['id']) => Promise<ArrayBuffer | null>;
}
