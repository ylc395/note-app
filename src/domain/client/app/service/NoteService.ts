import { container } from '#domain/shared/infra/singletons';
import { token as rpcToken } from '#domain/client/shared/infra/rpc';
import { DuplicatedNoteDTO, NoteTypes, NoteVO } from '#domain/shared/model/note';
import { EntityTypes } from '#domain/shared/model/entity';

import Workbench from '../model/Workbench';
import DomainEventBus from '../model/note/EventBus';
import TreeView from '../model/note/TreeView';

export default class NoteService {
  private readonly remote = container.resolve(rpcToken);

  public readonly workbench = container.resolve(Workbench);

  public readonly noteTreeView = new TreeView(NoteTypes.Note);

  public readonly materialTreeView = new TreeView(NoteTypes.Material);

  private readonly eventBus = container.resolve(DomainEventBus);

  public readonly createNote = async (
    params: { parentId?: NoteVO['parentId']; type: NoteTypes } | DuplicatedNoteDTO,
    open?: boolean,
  ) => {
    const note = await this.remote.note.create.mutate(params);
    this.eventBus.emit(DomainEventBus.eventNames.Created, note);

    if (open) {
      this.workbench.openEntity({ entityType: EntityTypes.Note, entityId: note.id });
    }
  };
}
