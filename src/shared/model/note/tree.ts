import type { ClientNote } from './index';
import Tree, { type TreeNode, type TreeVO } from '../abstract/Tree';

export interface NoteNodeAttr {
  icon: ClientNote['icon'];
}

export type NoteTreeNode = TreeNode<NoteNodeAttr>;

export type NoteTreeVO = TreeVO<ClientNote>;

export default class NoteTree extends Tree<ClientNote, NoteNodeAttr> {
  protected toNode(note: ClientNote | null) {
    if (note) {
      return { title: note.title, isLeaf: note.childrenCount === 0, attributes: { icon: note.icon } };
    }

    return { title: '根' };
  }

  fromSelected() {
    const tree = new NoteTree();
    tree.root.children = this.selectedNodes.map((node) => ({
      ...node,
      children: [],
      isSelected: false,
      isLeaf: true,
      isExpanded: false,
    }));

    return tree;
  }
}
