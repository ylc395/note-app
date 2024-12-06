import EventBus from '#domain/client/app/infra/EventBus';
import type { UpdatedEvent as BaseUpdatedEvent } from '#domain/client/app/model/entity/events';
import type { NotePatchDTO, NoteVO } from '#domain/shared/model/note';

enum EventNames {
  Updated = 'updated',
  Removed = 'removed',
}

type UpdateEvent = BaseUpdatedEvent<NotePatchDTO>;

type Events = {
  [EventNames.Updated]: UpdateEvent;
  [EventNames.Removed]: NoteVO;
};

export default class NoteEventBus extends EventBus<Events> {
  constructor() {
    super('domain:notes');
  }

  public static readonly eventNames = EventNames;
}
