import { type MaterialVO, type DirectoryVO, type EntityMaterialVO, isEntityMaterial, isDirectory } from './index';
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
        title: material.name,
        isLeaf: !isDirectory(material) || material.childrenCount === 0,
        attributes: {
          icon: material.icon,
          isDirectory: isDirectory(material),
          mimeType: isEntityMaterial(material) ? material.mimeType : undefined,
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
