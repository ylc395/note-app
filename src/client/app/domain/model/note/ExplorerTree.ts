import { action, runInAction } from 'mobx';
import { singleton } from 'tsyringe';

import NoteTree from '@shared/domain/model/note/Tree';
export type { NoteTreeNode } from '@shared/domain/model/note/Tree';

@singleton()
export default class ExplorerNoteTree extends NoteTree {
  @action
  updateValidParentTargets() {
    for (const id of this.selectedNodeIds) {
      const node = this.getNode(id);

      node.isDisabled = true;
      node.parent!.isDisabled = true;

      for (const descendant of this.getDescendants(id)) {
        descendant.isDisabled = true;
      }
    }
  }

  getSelectedNodesAsTree() {
    const tree = new NoteTree();

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
