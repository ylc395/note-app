import {
  type MaterialVO,
  type DirectoryVO,
  type EntityMaterialVO,
  normalizeTitle,
  isDirectory,
} from '../../interface/material';
import Tree, { type TreeNode } from '../abstract/Tree';

export interface MaterialNodeAttr {
  icon: MaterialVO['icon'];
  isDirectory: boolean;
  mimeType?: EntityMaterialVO['mimeType'];
}

export type MaterialTreeNode = TreeNode<MaterialNodeAttr>;

export default class MaterialTree extends Tree<MaterialVO, MaterialNodeAttr> {
  protected toNode(material: MaterialVO | null) {
    if (material) {
      return {
        title: normalizeTitle(material),
        isLeaf: !isDirectory(material) || material.childrenCount === 0,
        attributes: {
          icon: material.icon,
          isDirectory: isDirectory(material),
          mimeType: isDirectory(material) ? undefined : material.mimeType,
        },
      };
    }

    return { title: '根' };
  }

  static from(materials: DirectoryVO[]) {
    const tree = new MaterialTree();
    tree.setChildren(materials, null);

    return tree;
  }
}
