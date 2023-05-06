import { singleton, container } from 'tsyringe';

import { MaterialDTO, DirectoryVO, MaterialVO, MaterialQuery, isDirectory, EntityMaterialVO } from 'interface/material';
import MaterialTree from 'model/material/Tree';
import { token as remoteToken } from 'infra/Remote';

import EditorService from './EditorService';
import { EntityTypes } from 'interface/entity';

@singleton()
export default class MaterialService {
  private readonly remote = container.resolve(remoteToken);

  private readonly fetchChildren = async (parentId: MaterialVO['parentId']) => {
    const { body: materials } = await this.remote.get<MaterialQuery, MaterialVO[]>(
      '/materials',
      parentId ? { parentId } : {},
    );
    return materials;
  };

  private readonly fetchTreeFragment = async (id: MaterialVO['id']) => {
    const { body: fragment } = await this.remote.get<void, MaterialVO[]>(`/materials/${id}/tree-fragment`);
    return fragment;
  };

  readonly materialTree = new MaterialTree({
    fetchChildren: this.fetchChildren,
    fetchTreeFragment: this.fetchTreeFragment,
  });

  readonly createDirectory = async (parentId?: DirectoryVO['parentId']) => {
    const { body: directory } = await this.remote.post<MaterialDTO, DirectoryVO>('/materials', {
      parentId: parentId || null,
    });

    if (parentId) {
      await this.materialTree.toggleExpand(parentId, true, true);
    }

    this.materialTree.updateTreeByEntity(directory);
    this.materialTree.toggleSelect(directory.id, true);
  };

  readonly createMaterial = async (newMaterial: MaterialDTO) => {
    const { body: material } = await this.remote.post<MaterialDTO, EntityMaterialVO>('/materials', newMaterial);

    if (newMaterial.parentId) {
      await this.materialTree.toggleExpand(newMaterial.parentId, true, true);
    }

    this.materialTree.updateTreeByEntity(material);
    this.materialTree.toggleSelect(material.id, true);
  };

  readonly selectMaterial = (material: MaterialVO, isMultiple: boolean) => {
    this.materialTree.toggleSelect(material.id, !isMultiple);

    if (!isMultiple && !isDirectory(material)) {
      const { openEntity } = container.resolve(EditorService);
      openEntity({ type: EntityTypes.Material, id: material.id });
    }
  };
}
