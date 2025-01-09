import EventBus from '#domain/client/shared/infra/EventBus';
import type { MemoPatchDTO, MemoVO } from '#domain/shared/model/memo';

export enum EventNames {
  Updated = 'updated',
  Created = 'created',
  Removed = 'removed',
}

interface UpdateEvent {
  id: MemoVO['id'];
  payload: MemoPatchDTO;
}

export const eventBus = new EventBus<{
  [EventNames.Updated]: UpdateEvent;
  [EventNames.Created]: MemoVO;
  [EventNames.Removed]: MemoVO;
}>('domain:memo');
