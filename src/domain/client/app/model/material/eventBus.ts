import EventBus from '#domain/client/app/infra/EventBus';
import type { MaterialVO } from '#domain/shared/model/material';
import type { UpdateEvent as BaseUpdateEvent } from '../../../common/model/entity';

export enum Events {
  Updated = 'updated',
}

export type UpdateEvent = BaseUpdateEvent<MaterialVO>;

export default new EventBus<{
  [Events.Updated]: UpdateEvent;
}>('material');
