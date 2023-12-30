import { type NoteVO, type ClientNoteQuery, normalizeTitle } from '@shared/domain/model/note';
import { EntityTypes } from '@shared/domain/model/entity';

import type TreeNode from '../abstract/TreeNode';
import Tree from '../abstract/Tree';

export type NoteTreeNode = TreeNode<NoteVO>;

export default class NoteTree extends Tree<NoteVO> {
  public readonly entityType = EntityTypes.Note;
  public async fetchChildren(parentId: NoteVO['parentId']) {
    const { body: notes } = await this.remote.get<ClientNoteQuery, NoteVO[]>('/notes', { parentId });
    return notes;
  }

  protected entityToNode(note: NoteVO | null) {
    return {
      title: note ? normalizeTitle(note) : '根',
      icon: note ? note.icon : null,
      isLeaf: note ? note.childrenCount === 0 : true,
    };
  }
}
