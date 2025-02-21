import { container } from '#domain/shared/infra/singletons';
import { token as rpcToken } from '#domain/client/shared/infra/rpc';
import { type DuplicatedNoteDTO, NoteTypes } from '#domain/shared/model/note';
import { EntityTypes } from '#domain/shared/model/entity';

import Workbench from '../model/Workbench';
import DomainEventBus from '../model/note/EventBus';
import TreeView from '../model/note/TreeView';

export default class NoteService {
  private readonly remote = container.resolve(rpcToken);

  public readonly workbench = container.resolve(Workbench);

  public readonly treeViews = {
    note: new TreeView(NoteTypes.Note),
    material: new TreeView(NoteTypes.Material),
  } as const;

  private readonly eventBus = container.resolve(DomainEventBus);

  public readonly duplicate = async (params: DuplicatedNoteDTO, open?: boolean) => {
    const newNote = await this.remote.note.create.mutate(params);
    this.eventBus.emit(DomainEventBus.eventNames.Created, newNote);

    if (open) {
      this.workbench.openEntity({ entityType: EntityTypes.Note, entityId: newNote.id });
    }
  };
}
