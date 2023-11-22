import { runInAction } from 'mobx';
import type { NoteVO } from '../../../../shared/model/note';
import Tree, { type TreeNode } from '../abstract/Tree';

export type NoteTreeNode = TreeNode<NoteVO>;

export default class NoteTree extends Tree<NoteVO> {
  protected entityToNode(note: NoteVO) {
    return { title: note.title, isLeaf: note.childrenCount === 0 };
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
