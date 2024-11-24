import EventBus from '#domain/client/app/infra/EventBus';
import type { EntityId } from '#domain/shared/model/entity';

export enum EventNames {
  Revealed = 'Revealed',
}

export type Events = {
  [EventNames.Revealed]: EntityId;
};

export function createEventBus(id: EntityId) {
  return new EventBus<Events>(`memo-list-${id}`);
}
