import { container } from '#domain/shared/infra/singletons';
import { token as rpcToken } from '#domain/client/shared/infra/rpc';
import type { NoteVO } from '#domain/shared/model/note';
import { EntityTypes } from '#domain/shared/model/entity';

import Workbench from '../model/Workbench';
import DomainEventBus from '../../shared/model/note/EventBus';

export default class NoteService {
  private readonly remote = container.resolve(rpcToken);

  private readonly workbench = container.resolve(Workbench);

  private eventBus = container.resolve(DomainEventBus);

  public readonly createNote = async (
    params?: { parentId?: NoteVO['parentId']; from?: NoteVO['id'] },
    open?: boolean,
  ) => {
    const note = await this.remote.note.create.mutate(params || {});
    this.eventBus.emit(DomainEventBus.eventNames.Created, note);

    if (open) {
      this.workbench.openEntity({ entityType: EntityTypes.Note, entityId: note.id });
    }
  };
}
