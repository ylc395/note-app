import { type NoteVO, normalizeTitle } from '@shared/domain/model/note';
import { EntityTypes } from '@shared/domain/model/entity';

import Tree from '../abstract/Tree';
import NoteTreeNode from './TreeNode';

export default class NoteTree extends Tree<NoteVO> {
  public readonly entityType = EntityTypes.Note;
  public async fetchChildren(parentId: NoteVO['parentId']) {
    const notes = await this.remote.note.query.query({ parentId });
    return notes;
  }

  public createNode(entity: NoteVO | null): NoteTreeNode {
    return new NoteTreeNode({ entity, tree: this });
  }

  public entityToNode(note: NoteVO | null) {
    return {
      title: note ? normalizeTitle(note) : '根',
      icon: note ? note.icon : null,
      isLeaf: note ? note.childrenCount === 0 : false,
    };
  }
}
