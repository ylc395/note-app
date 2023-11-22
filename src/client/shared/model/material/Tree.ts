import { runInAction } from 'mobx';
import { type MaterialVO, isDirectory } from '../../../../shared/model/material';
import Tree, { type TreeNode } from '../abstract/Tree';

export type MaterialTreeNode = TreeNode<MaterialVO>;

export default class MaterialTree extends Tree<MaterialVO> {
  protected entityToNode(material: MaterialVO) {
    return {
      title: material.name,
      isLeaf: !isDirectory(material) || material.childrenCount === 0,
    };
  }

  getSelectedNodesAsTree() {
    const tree = new MaterialTree();

    runInAction(() => {
      tree.root.children = this.selectedNodes.map((node) => ({
        ...node,
        children: [],
        isSelected: false,
        isLeaf: true,
        isExpanded: false,
      }));
    });

    return tree;
  }
}
