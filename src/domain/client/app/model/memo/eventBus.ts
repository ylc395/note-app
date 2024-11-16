import EventBus from '#domain/client/app/infra/EventBus';
import type { MemoPatchDTO, MemoVO } from '#domain/shared/model/memo';

export enum EventNames {
  Updated = 'updated',
  Created = 'created',
  Removed = 'removed',
}

export interface UpdateEvent {
  id: MemoVO['id'];
  payload: MemoPatchDTO;
}

type Events = {
  [EventNames.Updated]: UpdateEvent;
  [EventNames.Created]: MemoVO;
  [EventNames.Removed]: MemoVO;
};

export const eventBus = new EventBus<Events>('domain:memo');
