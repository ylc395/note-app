import type { NoteVO } from '@shared/domain/model/note';
import TreeNode from '../abstract/TreeNode';

export default class NoteTreeNode extends TreeNode<NoteVO> {
  protected fetchChildren() {
    return this.remote.note.query.query({ parentId: this.isRoot ? null : this.id });
  }
}
