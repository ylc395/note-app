import EventBus from '#domain/client/shared/infra/EventBus';
import type { NotePatchDTO, NoteTypes, NoteVO } from '#domain/shared/model/note';

enum EventNames {
  Created = 'note.created',
  Updated = 'note.updated',
  MoveStart = 'note.moveStart',
}

export type CreatedEvent = NoteVO;

export interface UpdatedEvent extends NotePatchDTO {
  id: NoteVO['id'];
  type: NoteTypes;
}

export default class DomainEventBus extends EventBus<{
  [EventNames.MoveStart]: NoteVO[];
  [EventNames.Created]: NoteVO;
  [EventNames.Updated]: UpdatedEvent;
}> {
  constructor() {
    super('domain:notes');
  }

  static eventNames = EventNames;
}
