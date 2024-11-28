import { container } from '#domain/shared/infra/singletons';
import { token as rpcToken } from '#domain/client/shared/infra/rpc';
import type { NoteVO } from '#domain/shared/model/note';
import NoteExplorer from '#domain/client/app/model/note/Explorer';
import { EntityTypes } from '#domain/shared/model/entity';
import { eventBus, EventNames } from '#domain/client/app/model/note/eventBus';

import Workbench from '../model/workbench/Workbench';
import MoveBehavior from '../model/entity/MoveBehavior';
import type { MoveEvent } from '../model/entity/events';

export default class NoteService {
  constructor() {
    this.moveBehavior.events.on(MoveBehavior.eventNames.Move, this.moveNotes);
  }

  private readonly remote = container.resolve(rpcToken);
  private readonly explorer = container.resolve(NoteExplorer);
  private readonly workbench = container.resolve(Workbench);
  private readonly moveBehavior = container.resolve(MoveBehavior);

  private readonly moveNotes = async ({ items, target }: MoveEvent) => {
    const noteIds = items.filter(({ entityType }) => entityType === EntityTypes.Note).map(({ entityId }) => entityId);

    if (noteIds.length === 0) {
      return;
    }

    await this.remote.note.batchUpdate.mutate([noteIds, { parentId: target.entityId }]);

    for (const noteId of noteIds) {
      eventBus.emit(EventNames.Updated, {
        trigger: this.moveBehavior,
        id: noteId,
        payload: { parentId: target.entityId },
      });
    }
  };

  public readonly createNote = async (
    params?: { parentId?: NoteVO['parentId']; from?: NoteVO['id'] },
    open = false,
  ) => {
    const note = await this.remote.note.create.mutate(params || {});

    this.explorer.tree.add(note);
    this.explorer.tree.getNode(note.id).toggleSelect(true);

    if (note.parentId) {
      await this.explorer.reveal(note.parentId);
      this.explorer.tree.getNode(note.parentId).toggleExpand(true);
    }

    if (open) {
      this.workbench.openEntity({ entityType: EntityTypes.Note, entityId: note.id });
    }
  };
}
