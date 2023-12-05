import NoteTree, { NoteTreeNode } from '@shared/domain/model/note/Tree';
import { runInAction } from 'mobx';

export type { NoteTreeNode } from '@shared/domain/model/note/Tree';

export default class ExplorerNoteTree extends NoteTree {
  updateValidParentTargets(ids?: (NoteTreeNode['id'] | null)[]) {
    for (const id of ids || this.selectedNodeIds) {
      const node = this.getNode(id);

      node.isDisabled = true;
      node.parent!.isDisabled = true;

      for (const descendant of this.getDescendants(id)) {
        descendant.isDisabled = true;
      }
    }
  }

  getSelectedNodesAsTree() {
    const tree = new ExplorerNoteTree();

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
