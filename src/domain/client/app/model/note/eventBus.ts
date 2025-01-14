import EventBus from '#domain/client/shared/infra/EventBus';
import type { NoteVO } from '#domain/shared/model/note';

enum EventNames {
  MoveStart = 'move.start',
}

export default class DomainEventBus extends EventBus<{
  [EventNames.MoveStart]: NoteVO[];
}> {
  constructor() {
    super('domain:notes');
  }

  static eventNames = EventNames;
}
