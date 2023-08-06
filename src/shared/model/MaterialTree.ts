import { type MaterialVO, normalizeTitle, isDirectory, DirectoryVO } from '../interface/material';
import Tree, { type Options } from './Tree';

export default class MaterialTree extends Tree<MaterialVO> {
  protected toNode(material: MaterialVO | null) {
    if (material) {
      return { title: normalizeTitle(material), isLeaf: isDirectory(material) };
    }

    return { title: '根' };
  }

  static from(materials: DirectoryVO[], options?: Options) {
    const tree = new MaterialTree(options);

    for (const material of materials) {
      tree.updateTree(material);
    }

    return tree;
  }
}
