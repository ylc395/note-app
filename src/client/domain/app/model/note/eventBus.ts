import EventBus from '@domain/app/infra/EventBus';
import type { NoteVO } from '@shared/domain/model/note';
import type { ActionEvent, UpdateEvent as BaseUpdateEvent } from '../entity';

export enum Events {
  Updated = 'updated',
  Action = 'action',
}

export type UpdateEvent = BaseUpdateEvent<
  Partial<Pick<NoteVO, 'title' | 'icon' | 'parentId' | 'body' | 'updatedAt' | 'isStar'>>
>;

export type { ActionEvent } from '../entity';

export const eventBus = new EventBus<{
  [Events.Updated]: UpdateEvent;
  [Events.Action]: ActionEvent;
}>('note');
