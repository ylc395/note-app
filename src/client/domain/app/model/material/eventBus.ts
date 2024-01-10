import EventBus from '@domain/app/infra/EventBus';
import type { MaterialVO } from '@shared/domain/model/material';

export enum Events {
  Updated = 'material.updated',
}

export interface UpdateEvent {
  id: MaterialVO['id'];
  title?: MaterialVO['title'];
  icon?: MaterialVO['icon'];
  parentId?: MaterialVO['parentId'];
}

export default new EventBus<{
  [Events.Updated]: UpdateEvent;
}>('material');
