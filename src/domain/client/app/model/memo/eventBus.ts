import EventBus from '#domain/client/shared/infra/EventBus';
import type { MemoVO } from '#domain/shared/model/memo';

enum EventNames {
  Created = 'created',
  Removed = 'removed',
  Updated = 'updated',
}

export default class DomainEventBus extends EventBus<{
  [EventNames.Created]: MemoVO;
  [EventNames.Removed]: MemoVO;
  [EventNames.Updated]: MemoVO;
}> {
  constructor() {
    super('domain:memo');
  }

  public static readonly eventNames = EventNames;
}
