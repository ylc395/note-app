import { runInAction } from 'mobx';
import MaterialTree from 'model/material/Tree';

export type { MaterialTreeNode } from 'model/material/Tree';

export default class ExplorerMaterialTree extends MaterialTree {
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
