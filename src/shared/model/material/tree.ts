import { type MaterialVO, type MaterialEntity, isEntityMaterial, isDirectory } from './index';
import Tree, { type TreeNode, type TreeVO } from '../abstract/Tree';

export interface MaterialNodeAttr {
  icon: MaterialVO['icon'];
  mimeType?: MaterialEntity['mimeType'];
}

export type MaterialTreeNode = TreeNode<MaterialNodeAttr>;

export type MaterialTreeVO = TreeVO<MaterialVO>;

export default class MaterialTree extends Tree<MaterialVO, MaterialNodeAttr> {
  protected toNode(material: MaterialVO | null) {
    if (material) {
      return {
        title: material.name,
        isLeaf: isDirectory(material) ? material.childrenCount === 0 : true,
        attributes: {
          icon: material.icon,
          mimeType: isEntityMaterial(material) ? material.mimeType : undefined,
        },
      };
    }

    return { title: '根' };
  }
}
