import EventBus from '@domain/app/infra/EventBus';
import type { MemoVO } from '@shared/domain/model/memo';
import type { UpdateEvent as BaseUpdateEvent } from '../entity';

export enum Events {
  Updated = 'updated',
}

export type UpdateEvent = BaseUpdateEvent<Partial<Pick<MemoVO, 'isPinned' | 'updatedAt' | 'isStar'>>>;

export default new EventBus<{
  [Events.Updated]: UpdateEvent;
}>('memo');
