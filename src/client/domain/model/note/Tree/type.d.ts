import type { NoteVO as Note } from 'interface/Note';
import type { TreeNode } from 'model/abstract/Tree';

export interface NoteTreeNode extends TreeNode {
  note: Note;
  treeId: symbol;
}
