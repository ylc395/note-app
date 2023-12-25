import {
  type MaterialVO,
  type ClientMaterialQuery,
  isDirectoryVO,
  normalizeTitle,
} from '@shared/domain/model/material';
import Tree from '../abstract/Tree';
import type TreeNode from '../abstract/TreeNode';
import { EntityTypes } from '@shared/domain/model/entity';

export type MaterialTreeNode = TreeNode<MaterialVO>;

export default class MaterialTree extends Tree<MaterialVO> {
  public readonly entityType = EntityTypes.Material;
  async fetchChildren(parentId: MaterialVO['parentId']) {
    const { body: materials } = await this.remote.get<ClientMaterialQuery, MaterialVO[]>('/materials', { parentId });
    return materials;
  }

  protected entityToNode(material: MaterialVO | null) {
    return {
      title: material ? normalizeTitle(material) : '根',
      isLeaf: material ? !isDirectoryVO(material) || material.childrenCount === 0 : true,
    };
  }
}
