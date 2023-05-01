import type { DirectoryVO, EntityMaterialVO, MaterialDTO, MaterialQuery, MaterialVO } from 'interface/material';

export type Directory = Pick<MaterialDTO, 'name' | 'parentId' | 'icon'>;

export interface MaterialRepository {
  createDirectory: (directory: Directory) => Promise<DirectoryVO>;
  createEntity: (material: MaterialDTO) => Promise<EntityMaterialVO>;
  findAll: (query: MaterialQuery) => Promise<MaterialVO[]>;
  findOneDirectoryById: (id: MaterialVO['id']) => Promise<DirectoryVO | null>;
}
