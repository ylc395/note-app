import EventBus from '#domain/client/app/infra/EventBus';
import type { UpdatedEvent as BaseUpdatedEvent } from '#domain/client/app/model/entity/events';
import type { MemoPatchDTO, MemoVO } from '#domain/shared/model/memo';

enum EventNames {
  Updated = 'updated',
  Created = 'created',
  Removed = 'removed',
}

type UpdateEvent = BaseUpdatedEvent<MemoPatchDTO>;

type Events = {
  [EventNames.Updated]: UpdateEvent;
  [EventNames.Created]: MemoVO;
  [EventNames.Removed]: MemoVO;
};

export default class MemoEventBus extends EventBus<Events> {
  constructor() {
    super('domain:memo');
  }

  public static readonly eventNames = EventNames;
}
