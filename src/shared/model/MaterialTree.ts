import { type MaterialVO, normalizeTitle, isDirectory, DirectoryVO } from '../interface/material';
import Tree from './Tree';

export default class MaterialTree extends Tree<MaterialVO> {
  protected toNode(material: MaterialVO | null) {
    if (material) {
      return { title: normalizeTitle(material), isLeaf: isDirectory(material) };
    }

    return { title: '根' };
  }

  static fromMaterials(materials: DirectoryVO[]) {
    const tree = new MaterialTree();

    for (const material of materials) {
      tree.updateTree(material);
    }

    return tree;
  }
}
