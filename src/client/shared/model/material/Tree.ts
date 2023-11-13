import { type MaterialVO, type MaterialEntity, isEntityMaterial, isDirectory } from '../../../../shared/model/material';
import Tree, { type TreeNode } from '../abstract/Tree';

interface MaterialNodeAttr {
  icon: MaterialVO['icon'];
  mimeType?: MaterialEntity['mimeType'];
}

export type MaterialTreeNode = TreeNode<MaterialNodeAttr>;

export default class MaterialTree extends Tree<MaterialNodeAttr, MaterialVO> {
  protected toNode(material: MaterialVO | null) {
    if (material) {
      return {
        title: material.name,
        isLeaf: !isDirectory(material) || material.childrenCount === 0,
        attributes: {
          icon: material.icon,
          mimeType: isEntityMaterial(material) ? material.mimeType : undefined,
        },
      };
    }

    return { title: '根' };
  }
}
