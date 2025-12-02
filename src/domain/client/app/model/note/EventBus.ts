import EventBus from '#domain/client/shared/infra/EventBus';
import { EntityTypes } from '#domain/shared/model/entity';
import type { NotePatchDTO, NoteVO } from '#domain/shared/model/note';
import container from '#utils/singletonContainer';
import RecyclableEventBus, { type PutEvent } from '../recyclable/EventBus';

enum EventNames {
  Created = 'note.created',
  Updated = 'note.updated',
  Deleted = 'note.deleted',
  MoveStart = 'note.moveStart',
}

export type CreatedEvent = NoteVO;

export interface UpdatedEvent {
  id: NoteVO['id'];
  source?: unknown;
  payload: NotePatchDTO & { mimeType?: NoteVO['mimeType'] };
}

export default class DomainEventBus extends EventBus<{
  [EventNames.MoveStart]: NoteVO[];
  [EventNames.Created]: NoteVO;
  [EventNames.Updated]: UpdatedEvent;
  [EventNames.Deleted]: { noteId: NoteVO['id'] };
}> {
  constructor() {
    super('domain:notes');

    this.recyclableEventBus.on(RecyclableEventBus.eventNames.Put, this.handleRecyclablePut.bind(this));
  }

  private readonly recyclableEventBus = container.resolve(RecyclableEventBus);

  private handleRecyclablePut({ entityId, entityType }: PutEvent) {
    if (entityType === EntityTypes.Note) {
      this.emit(EventNames.Deleted, { noteId: entityId });
    }
  }

  static eventNames = EventNames;
}
