import { container, singleton } from 'tsyringe';

import { token as rpcToken } from '@domain/common/infra/rpc';
import type { NoteVO } from '@shared/domain/model/note';
import { Workbench } from '@domain/app/model/workbench';
import NoteEditor from '@domain/app/model/note/Editor';
import NoteExplorer from '@domain/app/model/note/Explorer';
import { type EntityParentId, EntityTypes } from '@shared/domain/model/entity';
import { eventBus, Events } from '@domain/app/model/note/eventBus';
import TreeNode from '@domain/common/model/abstract/TreeNode';
import MoveBehavior from './common/MoveBehavior';

@singleton()
export default class NoteService {
  private readonly remote = container.resolve(rpcToken);
  private readonly explorer = container.resolve(NoteExplorer);
  private readonly workbench = container.resolve(Workbench);

  private readonly moveNotes = async (parentId: EntityParentId, ids: NoteVO['id'][]) => {
    await this.remote.note.batchUpdate.mutate([ids, { parentId }]);
    ids.forEach((id) => eventBus.emit(Events.Updated, { explorerUpdated: true, trigger: this.move, parentId, id }));
  };

  public readonly move = new MoveBehavior({
    explorer: this.explorer,
    itemToIds: NoteService.getNoteIds,
    onMove: this.moveNotes,
  });

  public readonly createNote = async (params?: { parentId?: NoteVO['parentId']; from?: NoteVO['id'] }) => {
    const note = await this.remote.note.create.mutate(params || {});

    this.explorer.tree.updateTree(note);
    this.explorer.tree.setSelected([note.id]);

    if (note.parentId) {
      await this.explorer.reveal(note.parentId, { expand: true });
    }

    this.workbench.openEntity({ entityType: EntityTypes.Note, entityId: note.id });
  };

  public static getNoteIds(item: unknown) {
    if (item instanceof TreeNode && item.entityLocator.entityType === EntityTypes.Note) {
      return item.tree.getSelectedNodeIds();
    }

    if (item instanceof NoteEditor) {
      return [item.entityLocator.entityId];
    }
  }
}
