import type { NoteVO } from '@shared/domain/model/note';
import { EntityTypes } from '@shared/domain/model/entity';

import Tree from '../abstract/Tree';
import NoteTreeNode from './TreeNode';

export default class NoteTree extends Tree<NoteVO> {
  public readonly entityType = EntityTypes.Note;

  protected createNode(entity: NoteVO | null): NoteTreeNode {
    return new NoteTreeNode({ entity, tree: this });
  }

  public queryChildren(id: NoteVO['parentId'] | NoteVO['id'][]) {
    return this.remote.note.query.query({ parentId: id });
  }
}
