import { type NoteVO, normalizeTitle } from '@shared/domain/model/note';
import TreeNode from '../abstract/TreeNode';

export default class NoteTreeNode extends TreeNode<NoteVO> {
  public readonly entityToNode = (note: NoteVO | null) => {
    return {
      title: note ? normalizeTitle(note) : '根',
      icon: note ? note.icon : null,
    };
  };
}
