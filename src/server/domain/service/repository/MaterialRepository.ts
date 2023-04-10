import type { DirectoryVO, EntityMaterialVO, MaterialDTO } from 'interface/material';

export type Directory = Pick<MaterialDTO, 'name' | 'parentId' | 'icon'>;

export interface MaterialRepository {
  createDirectory: (directory: Directory) => Promise<DirectoryVO>;
  createEntity: (material: MaterialDTO) => Promise<EntityMaterialVO>;
}
