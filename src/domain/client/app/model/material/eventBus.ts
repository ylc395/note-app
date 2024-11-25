import EventBus from '#domain/client/app/infra/EventBus';
import type { UpdatedEvent as BaseUpdatedEvent } from '#domain/client/app/model/entity/events';
import type { MaterialPatchDTO, MaterialVO } from '#domain/shared/model/material';

export enum EventNames {
  Updated = 'updated',
  Removed = 'removed',
}

export type UpdateEvent = BaseUpdatedEvent<MaterialPatchDTO>;

type Events = {
  [EventNames.Updated]: UpdateEvent;
  [EventNames.Removed]: MaterialVO;
};

export const eventBus = new EventBus<Events>('domain:material');
