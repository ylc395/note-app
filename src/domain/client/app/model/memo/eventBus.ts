import EventBus from '#domain/client/app/infra/EventBus';
import type { MemoPatchDTO, MemoVO } from '#domain/shared/model/memo';

export enum EventNames {
  Updated = 'updated',
  Created = 'created',
}

export interface UpdateEvent {
  id: MemoVO['id'];
  payload: MemoPatchDTO;
}

type Events = {
  [EventNames.Updated]: UpdateEvent;
  [EventNames.Created]: MemoVO;
};

export default new EventBus<Events>('domain:memo');
