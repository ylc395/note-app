import EventBus from '@domain/app/infra/EventBus';
import type { MaterialVO } from '@shared/domain/model/material';
import type { ActionEvent, UpdateEvent as BaseUpdateEvent } from '../entity';

export enum Events {
  Updated = 'material.updated',
  Action = 'material.action',
}

export type UpdateEvent = BaseUpdateEvent<{
  title?: MaterialVO['title'];
  icon?: MaterialVO['icon'];
  parentId?: MaterialVO['parentId'];
  updatedAt?: number;
}>;

export type { ActionEvent } from '../entity';

export default new EventBus<{
  [Events.Updated]: UpdateEvent;
  [Events.Action]: ActionEvent;
}>('material');
