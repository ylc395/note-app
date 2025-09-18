import EventBus from '#domain/client/shared/infra/EventBus';
import type { EntityId, EntityTypes } from '#domain/shared/model/entity';
import type { RecyclableVO } from '#domain/shared/model/recyclable';

enum EventNames {
  Put = 'recyclable.put',
  Recover = 'recyclable.recover',
}

export interface PutEvent {
  entityId: EntityId[];
  entityType: EntityTypes;
}

export default class StarEventBus extends EventBus<{
  [EventNames.Put]: PutEvent;
  [EventNames.Recover]: RecyclableVO;
}> {
  constructor() {
    super('recyclable-eventBus');
  }

  public static eventNames = EventNames;
}
