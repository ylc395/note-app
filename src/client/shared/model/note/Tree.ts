import { action } from 'mobx';
import type { NoteVO } from '../../../../shared/model/note';
import Tree, { type TreeNode } from '../abstract/Tree';

export interface NoteNodeAttr {
  icon: NoteVO['icon'];
}

export type NoteTreeNode = TreeNode<NoteNodeAttr>;

export default class NoteTree extends Tree<NoteVO, NoteNodeAttr> {
  protected toNode(note: NoteVO | null) {
    if (note) {
      return { title: note.title, isLeaf: note.childrenCount === 0, attributes: { icon: note.icon } };
    }

    return { title: '根' };
  }

  @action
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
