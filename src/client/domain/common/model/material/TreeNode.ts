import { type MaterialVO, normalizeTitle } from '@shared/domain/model/material';
import TreeNode from '../abstract/TreeNode';

export default class MaterialTreeNode extends TreeNode<MaterialVO> {
  public entityToNode = (material: MaterialVO | null) => {
    return {
      icon: material ? material.icon : null,
      title: material ? normalizeTitle(material) : '根',
      isLeaf: material ? material.childrenCount === 0 : false,
    };
  };
}
