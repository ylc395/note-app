import { type NoteVO, normalizeTitle } from '../../../../shared/model/note';
import Tree, { type TreeNode } from '../abstract/Tree';

export type NoteTreeNode = TreeNode<NoteVO>;

export default class NoteTree extends Tree<NoteVO> {
  protected entityToNode(note: NoteVO) {
    return {
      title: normalizeTitle(note),
      isLeaf: note.childrenCount === 0,
    };
  }
}
