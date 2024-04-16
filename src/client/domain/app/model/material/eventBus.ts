import EventBus from '@domain/app/infra/EventBus';
import type { MaterialVO } from '@shared/domain/model/material';
import type { UpdateEvent as BaseUpdateEvent } from '../entity';

export enum Events {
  Updated = 'updated',
}

export type UpdateEvent = BaseUpdateEvent<
  Partial<Pick<MaterialVO, 'title' | 'icon' | 'parentId' | 'updatedAt' | 'isStar'>>
>;

export default new EventBus<{
  [Events.Updated]: UpdateEvent;
}>('material');
