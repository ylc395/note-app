import EventBus from '#domain/client/shared/infra/EventBus';
import type { MemoVO } from '#domain/shared/model/memo';

export enum EventNames {
  Created = 'created',
  Removed = 'removed',
}

export const eventBus = new EventBus<{
  [EventNames.Created]: MemoVO;
  [EventNames.Removed]: MemoVO;
}>('domain:memo');
