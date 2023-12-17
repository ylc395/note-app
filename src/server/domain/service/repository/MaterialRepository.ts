import type {
  NewMaterialDirectory,
  NewMaterialEntity,
  MaterialDirectory,
  Material,
  MaterialQuery,
  MaterialEntity,
  MaterialPatch,
} from '@domain/model/material.js';

export interface MaterialRepository {
  createDirectory: (directory: NewMaterialDirectory) => Promise<MaterialDirectory>;
  createEntity: (material: NewMaterialEntity) => Promise<MaterialEntity>;
  update(id: Material['id'], material: MaterialPatch): Promise<Material | null>;
  update(id: Material['id'][], material: MaterialPatch): Promise<Material[]>;
  findAll: (query: MaterialQuery) => Promise<Material[]>;
  findChildrenIds: (
    ids: Material['id'][],
    availableOnly?: boolean,
  ) => Promise<Record<Material['id'], Material['id'][]>>;
  findDescendantIds: (materialIds: Material['id'][]) => Promise<Record<Material['id'], Material['id'][]>>;
  findAncestorIds: (materialIds: Material['id'][]) => Promise<Record<Material['id'], Material['id'][]>>;
  findOneById: (id: Material['id'], availableOnly?: boolean) => Promise<Material | null>;
  findBlobById: (id: Material['id']) => Promise<ArrayBuffer | null>;
}
