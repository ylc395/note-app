import { type MaterialVO, isDirectoryVO, normalizeTitle } from '@shared/domain/model/material';
import Tree, { type TreeNode } from '../abstract/Tree';

export type MaterialTreeNode = TreeNode<MaterialVO>;

export default class MaterialTree extends Tree<MaterialVO> {
  protected entityToNode(material: MaterialVO | null) {
    return material
      ? {
          title: normalizeTitle(material),
          isLeaf: !isDirectoryVO(material) || material.childrenCount === 0,
        }
      : {};
  }
}
