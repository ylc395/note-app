import { singleton, container } from 'tsyringe';

import { MaterialDTO, DirectoryVO, MaterialVO, MaterialQuery, isDirectory, EntityMaterialVO } from 'interface/material';
import MaterialTree, { type MaterialTreeNode } from 'model/material/Tree';
import { token as remoteToken } from 'infra/Remote';
import { materialDomainInputToken } from 'infra/UI';

@singleton()
export default class MaterialService {
  private readonly remote = container.resolve(remoteToken);
  private readonly userInput = container.resolve(materialDomainInputToken);

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

  readonly createMaterial = async (parentId: MaterialVO['id']) => {
    const newMaterial = await this.userInput.getNewMaterial();

    if (!newMaterial) {
      return;
    }

    const { body: material } = await this.remote.post<MaterialDTO, EntityMaterialVO>('/materials', {
      parentId,
      ...newMaterial,
    });

    if (parentId) {
      await this.materialTree.toggleExpand(parentId, true, true);
    }

    this.materialTree.updateTreeByEntity(material);
    this.materialTree.toggleSelect(material.id, true);
  };

  readonly selectMaterial = (node: MaterialTreeNode, multiple: boolean) => {
    const selected = this.materialTree.toggleSelect(node.key, !multiple);

    if (selected && !multiple && !isDirectory(node.entity)) {
      // this.editor.openEntity({ entityType: EntityTypes.Note, entityId: node.key });
    }
  };
}
