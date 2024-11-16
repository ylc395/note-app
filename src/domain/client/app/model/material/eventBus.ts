import EventBus from '#domain/client/app/infra/EventBus';
import type { MaterialPatchDTO, MaterialVO } from '#domain/shared/model/material';

export enum EventNames {
  Updated = 'updated',
  Removed = 'removed',
}

export interface UpdateEvent {
  id: MaterialVO['id'];
  payload: MaterialPatchDTO;
  trigger: unknown;
}

type Events = {
  [EventNames.Updated]: UpdateEvent;
  [EventNames.Removed]: MaterialVO;
};

export const eventBus = new EventBus<Events>('domain:material');
