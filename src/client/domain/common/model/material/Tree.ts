import { type MaterialVO, normalizeTitle } from '@shared/domain/model/material';
import Tree from '../abstract/Tree';
import type TreeNode from '../abstract/TreeNode';
import { EntityTypes } from '@shared/domain/model/entity';

export type MaterialTreeNode = TreeNode<MaterialVO>;

export default class MaterialTree extends Tree<MaterialVO> {
  public readonly entityType = EntityTypes.Material;
  async fetchChildren(parentId: MaterialVO['parentId']) {
    const materials = await this.remote.material.query.query({ parentId });
    return materials;
  }

  protected queryFragments(id: MaterialVO['id']) {
    return this.remote.material.query.query({ to: id });
  }

  protected entityToNode(material: MaterialVO | null) {
    return {
      icon: material ? material.icon : null,
      title: material ? normalizeTitle(material) : '根',
      isLeaf: material ? material.childrenCount === 0 : false,
    };
  }
}
