import { type NoteVO, normalizeTitle } from '@shared/domain/model/note';
import TreeNode from '../abstract/TreeNode';

export default class NoteTreeNode extends TreeNode<NoteVO> {
  public entityToNode(note: NoteVO | null) {
    return {
      title: note ? normalizeTitle(note) : '根',
      icon: note ? note.icon : null,
      isLeaf: note ? note.childrenCount === 0 : false,
    };
  }
}
