import { type MaterialVO, normalizeTitle, isDirectory } from '../interface/material';
import Tree from './Tree';

export default class MaterialTree extends Tree<MaterialVO> {
  protected toNode(material: MaterialVO | null) {
    if (material) {
      return { title: normalizeTitle(material), isLeaf: isDirectory(material) };
    }

    return { title: '根' };
  }
}
