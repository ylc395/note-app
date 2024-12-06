import EventBus from '#domain/client/app/infra/EventBus';
import type { UpdatedEvent as BaseUpdatedEvent } from '#domain/client/app/model/entity/events';
import type { MaterialPatchDTO, MaterialVO } from '#domain/shared/model/material';

enum EventNames {
  Updated = 'updated',
  Removed = 'removed',
}

type UpdateEvent = BaseUpdatedEvent<MaterialPatchDTO>;

type Events = {
  [EventNames.Updated]: UpdateEvent;
  [EventNames.Removed]: MaterialVO;
};

export default class DomainEventBus extends EventBus<Events> {
  constructor() {
    super('domain:material');
  }

  public static readonly eventNames = EventNames;
}
