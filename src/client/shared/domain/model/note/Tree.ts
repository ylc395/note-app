import { container } from 'tsyringe';
import { type NoteVO, normalizeTitle, type ClientNoteQuery } from '@shared/domain/model/note';

import { token as remoteToken } from '../../infra/remote';
import Tree, { type TreeNode } from '../abstract/Tree';

export type NoteTreeNode = TreeNode<NoteVO>;

export default class NoteTree extends Tree<NoteVO> {
  constructor() {
    super();
    this.on('nodeExpanded', this.loadChildren);
  }
  private readonly remote = container.resolve(remoteToken);

  readonly loadChildren = async (parentId?: NoteVO['parentId']) => {
    const { body: notes } = await this.remote.get<ClientNoteQuery, NoteVO[]>('/notes', { parentId });
    this.updateChildren(parentId || null, notes);
  };

  protected entityToNode(note: NoteVO) {
    return {
      title: normalizeTitle(note),
      isLeaf: note.childrenCount === 0,
    };
  }
}
