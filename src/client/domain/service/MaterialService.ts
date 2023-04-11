import { singleton, container } from 'tsyringe';

import { MaterialDTO, DirectoryVO, MaterialVO, MaterialQuery, isDirectory } from 'interface/material';
import { token as remoteToken } from 'infra/Remote';
import MaterialTree, { MaterialTreeNode } from 'model/material/Tree';

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
  };

  readonly selectMaterial = (node: MaterialTreeNode, multiple: boolean) => {
    const selected = this.materialTree.toggleSelect(node.key, !multiple);

    if (selected && !multiple && !isDirectory(node.entity)) {
      // this.editor.openEntity({ entityType: EntityTypes.Note, entityId: node.key });
    }
  };
}
