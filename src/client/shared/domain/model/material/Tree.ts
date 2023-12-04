import { type MaterialVO, isDirectory } from '@shared/domain/model/material';
import Tree, { type TreeNode } from '../abstract/Tree';

export type MaterialTreeNode = TreeNode<MaterialVO>;

export default class MaterialTree extends Tree<MaterialVO> {
  protected entityToNode(material: MaterialVO) {
    return {
      title: material.title,
      isLeaf: !isDirectory(material) || material.childrenCount === 0,
    };
  }
}
