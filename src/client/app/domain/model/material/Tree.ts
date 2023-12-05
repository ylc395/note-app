import { runInAction } from 'mobx';
import MaterialTree, { type MaterialTreeNode } from '@shared/domain/model/material/Tree';
import { isDirectory } from '@shared/domain/model/material';

export type { MaterialTreeNode } from '@shared/domain/model/material/Tree';

export default class ExplorerMaterialTree extends MaterialTree {
  updateValidParentTargets(ids?: (MaterialTreeNode['id'] | null)[]) {
    for (const node of this.allNodes) {
      node.isDisabled = !!node.entity && isDirectory(node.entity);
    }

    for (const id of ids || this.selectedNodeIds) {
      const node = this.getNode(id);

      node.isDisabled = false;
      node.parent!.isDisabled = false;

      for (const descendant of this.getDescendants(id)) {
        descendant.isDisabled = false;
      }
    }
  }

  getSelectedNodesAsTree() {
    const tree = new ExplorerMaterialTree();

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
