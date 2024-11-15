import EventBus from '#domain/client/app/infra/EventBus';
import type { MaterialPatchDTO, MaterialVO } from '#domain/shared/model/material';

export enum Events {
  Updated = 'updated',
}

export interface UpdateEvent {
  id: MaterialVO['id'];
  payload: MaterialPatchDTO;
  trigger: unknown;
}

export default new EventBus<{ [Events.Updated]: UpdateEvent }>('domain:material');
