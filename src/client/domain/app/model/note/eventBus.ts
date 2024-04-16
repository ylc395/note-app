import EventBus from '@domain/app/infra/EventBus';
import type { NoteVO } from '@shared/domain/model/note';
import type { UpdateEvent as BaseUpdateEvent } from '../entity';

export enum Events {
  Updated = 'updated',
}

export type UpdateEvent = BaseUpdateEvent<
  Partial<Pick<NoteVO, 'title' | 'icon' | 'parentId' | 'body' | 'updatedAt' | 'isStar'>>
>;

export const eventBus = new EventBus<{
  [Events.Updated]: UpdateEvent;
}>('note');
