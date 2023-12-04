import NoteTree from '@domain/model/note/Tree';
import { runInAction } from 'mobx';

export type { NoteTreeNode } from '@domain/model/note/Tree';

export default class ExplorerNoteTree extends NoteTree {
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
