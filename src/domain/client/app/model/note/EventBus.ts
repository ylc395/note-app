import EventBus from '#domain/client/shared/infra/EventBus';
import type { NoteVO } from '#domain/shared/model/note';

enum EventNames {
  Created = 'note.created',
  MoveStart = 'note.moveStart',
}

export default class DomainEventBus extends EventBus<{
  [EventNames.MoveStart]: NoteVO[];
  [EventNames.Created]: NoteVO;
}> {
  constructor() {
    super('domain:notes');
  }

  static eventNames = EventNames;
}
