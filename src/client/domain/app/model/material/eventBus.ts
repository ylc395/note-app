import EventBus from '@domain/app/infra/EventBus';
import type { MaterialVO } from '@shared/domain/model/material';
import type { ActionEvent, UpdateEvent as BaseUpdateEvent } from '../entity';

export enum Events {
  Updated = 'updated',
  Action = 'action',
}

export type UpdateEvent = BaseUpdateEvent<
  Partial<Pick<MaterialVO, 'title' | 'icon' | 'parentId' | 'updatedAt' | 'isStar'>>
>;

export type { ActionEvent } from '../entity';

export default new EventBus<{
  [Events.Updated]: UpdateEvent;
  [Events.Action]: ActionEvent;
}>('material');
