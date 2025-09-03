import EventBus from '#domain/client/shared/infra/EventBus';
import type { EntityId } from '#domain/shared/model/entity';

enum EventNames {
  Changed = 'star.changed',
}

export default class StarEventBus extends EventBus<{
  [EventNames.Changed]: { entityId: EntityId; isStar: boolean };
}> {
  constructor() {
    super('star-eventBus');
  }

  public static eventNames = EventNames;
}
