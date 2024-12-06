import { normalizeTitle, type NoteVO } from '#domain/shared/model/note';
import { EntityTypes } from '#domain/shared/model/entity';

import Tree from '../abstract/Tree';
import { container } from '#domain/shared/infra/singletons';
import { token as rpcToken } from '../../infra/rpc';

export default class NoteTree extends Tree<NoteVO> {
  private readonly remote = container.resolve(rpcToken);

  public readonly entityType = EntityTypes.Note;

  protected toEntityLocator(node: NoteVO) {
    return {
      entityId: node.id,
      entityType: this.entityType,
    };
  }

  protected queryChildren(id: NoteVO['id'][] | NoteVO['parentId'], signal?: AbortController['signal']) {
    return this.remote.note.query.query({ parentId: id }, { signal });
  }

  protected queryPath(id: NoteVO['id']) {
    return this.remote.note.queryPath.query(id);
  }

  protected nodeToView(note: NoteVO | null) {
    return {
      title: note ? normalizeTitle(note) : '根',
      icon: note?.icon ?? null,
    };
  }
}
