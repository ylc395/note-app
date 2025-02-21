import { container } from '#domain/shared/infra/singletons';
import { token as rpcToken } from '#domain/client/shared/infra/rpc';
import { type DuplicatedNoteDTO, NoteTypes, type NoteVO } from '#domain/shared/model/note';
import { EntityTypes } from '#domain/shared/model/entity';

import Workbench from '../model/Workbench';
import DomainEventBus from '../model/note/EventBus';
import TreeView from '../model/note/TreeView';

export default class NoteService {
  private readonly remote = container.resolve(rpcToken);

  public readonly workbench = container.resolve(Workbench);

  public readonly treeViews = {
    [NoteTypes.Note]: new TreeView(NoteTypes.Note),
    [NoteTypes.Material]: new TreeView(NoteTypes.Material),
  } as const;

  private readonly eventBus = container.resolve(DomainEventBus);

  public readonly createNote = async (
    params: {
      type: NoteTypes;
      open?: boolean;
    },
    note?: Pick<NoteVO, 'parentId'> | DuplicatedNoteDTO,
  ) => {
    const newNote = await this.remote.note.create.mutate({ ...note, type: params.type });
    this.eventBus.emit(DomainEventBus.eventNames.Created, newNote);
    this.treeViews[params.type].newNoteEditor.set(newNote);

    if (params.open) {
      this.workbench.openEntity({ entityType: EntityTypes.Note, entityId: newNote.id });
    }
  };
}
