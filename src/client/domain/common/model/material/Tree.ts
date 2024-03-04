import { type MaterialVO, normalizeTitle } from '@shared/domain/model/material';
import Tree from '../abstract/Tree';
import { EntityTypes } from '@shared/domain/model/entity';
import MaterialTreeNode from './TreeNode';

export default class MaterialTree extends Tree<MaterialVO> {
  public readonly entityType = EntityTypes.Material;

  public createNode(entity: MaterialVO | null): MaterialTreeNode {
    return new MaterialTreeNode({ tree: this, entity });
  }

  public entityToNode(material: MaterialVO | null) {
    return {
      icon: material ? material.icon : null,
      title: material ? normalizeTitle(material) : '根',
      isLeaf: material ? material.childrenCount === 0 : false,
    };
  }
}
