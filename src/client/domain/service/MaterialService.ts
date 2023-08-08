import { singleton, container } from 'tsyringe';

import type { MaterialDTO, DirectoryVO, MaterialVO, MaterialQuery, EntityMaterialVO } from 'interface/material';
import { token as remoteToken } from 'infra/remote';
import type { SelectEvent } from 'model/abstract/Tree';
import MaterialTree from 'model/material/Tree';

import EditorService from './EditorService';
import { EntityTypes } from 'interface/entity';

@singleton()
export default class MaterialService {
  private readonly remote = container.resolve(remoteToken);
  readonly materialTree = new MaterialTree();

  constructor() {
    this.materialTree.on('nodeExpanded', this.loadChildren);
    this.materialTree.on('nodeSelected', this.selectMaterial);
  }

  readonly loadChildren = async (parentId: MaterialVO['parentId']) => {
    const { body: materials } = await this.remote.get<MaterialQuery, MaterialVO[]>(
      '/materials',
      parentId ? { parentId } : {},
    );

    this.materialTree.setChildren(materials, parentId);
  };

  private readonly fetchTreeFragment = async (id: MaterialVO['id']) => {
    const { body: fragment } = await this.remote.get<void, MaterialVO[]>(`/materials/${id}/tree-fragment`);
    return fragment;
  };

  readonly createDirectory = async (parentId?: DirectoryVO['parentId']) => {
    const { body: directory } = await this.remote.post<MaterialDTO, DirectoryVO>('/materials', {
      parentId: parentId || null,
    });

    if (parentId) {
      await this.materialTree.toggleExpand(parentId);
    }

    this.materialTree.updateTree(directory);
    this.materialTree.toggleSelect(directory.id);
  };

  readonly createMaterial = async (newMaterial: MaterialDTO) => {
    const { body: material } = await this.remote.post<MaterialDTO, EntityMaterialVO>('/materials', newMaterial);

    if (newMaterial.parentId && !this.materialTree.getNode(newMaterial.parentId).isExpanded) {
      await this.materialTree.toggleExpand(newMaterial.parentId);
    }

    this.materialTree.updateTree(material);
    this.materialTree.toggleSelect(material.id, { multiple: true });
  };

  private readonly selectMaterial = (materialId: MaterialVO['id'] | null, { multiple }: SelectEvent) => {
    if (!materialId) {
      throw new Error('invalid id');
    }

    const node = this.materialTree.getNode(materialId);

    if (!multiple && !node.attributes?.isDirectory) {
      const { openEntity } = container.resolve(EditorService);
      openEntity({ type: EntityTypes.Material, id: materialId, mimeType: node.attributes?.mimeType });
    }
  };
}
