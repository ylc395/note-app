import { container, singleton } from 'tsyringe';

import { token as rpcToken } from '@domain/client/common/infra/rpc';
import type { NoteVO } from '@domain/shared/model/note';
import { Workbench } from '@domain/client/app/model/workbench';
import NoteEditor from '@domain/client/app/model/note/Editor';
import NoteExplorer from '@domain/client/app/model/note/Explorer';
import { EntityTypes } from '@domain/shared/model/entity';
import { eventBus, Events } from '@domain/client/app/model/note/eventBus';
import TreeNode from '@domain/client/common/model/abstract/TreeNode';
import MoveBehavior, { Events as MoveEvents, type MoveEvent } from '../model/behavior/MoveBehavior';

@singleton()
export default class NoteService {
  private readonly remote = container.resolve(rpcToken);
  private readonly explorer = container.resolve(NoteExplorer);
  private readonly workbench = container.resolve(Workbench);
  private readonly moveService = container.resolve(MoveBehavior);

  constructor() {
    this.moveService.on(MoveEvents.Move, this.moveNotes);
  }

  private readonly moveNotes = async ({ items, target }: MoveEvent) => {
    if (target.entityType !== EntityTypes.Note) {
      return;
    }

    await this.remote.note.batchUpdate.mutate([items.map(({ entityId }) => entityId), { parentId: target.entityId }]);

    for (const note of items) {
      eventBus.emit(Events.Updated, {
        trigger: this.moveService,
        entity: { id: note.entityId, parentId: target.entityId },
      });
    }
  };

  public readonly createNote = async (params?: { parentId?: NoteVO['parentId']; from?: NoteVO['id'] }) => {
    const note = await this.remote.note.create.mutate(params || {});

    this.explorer.tree.updateTreeByEntity(note);
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
