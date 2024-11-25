import EventBus from '#domain/client/app/infra/EventBus';
import type { UpdatedEvent as BaseUpdatedEvent } from '#domain/client/app/model/entity/events';
import type { MemoPatchDTO, MemoVO } from '#domain/shared/model/memo';

export enum EventNames {
  Updated = 'updated',
  Created = 'created',
  Removed = 'removed',
}

export type UpdateEvent = BaseUpdatedEvent<MemoPatchDTO>;

type Events = {
  [EventNames.Updated]: UpdateEvent;
  [EventNames.Created]: MemoVO;
  [EventNames.Removed]: MemoVO;
};

export const eventBus = new EventBus<Events>('domain:memo');
