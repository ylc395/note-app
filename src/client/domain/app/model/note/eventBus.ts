import EventBus from '@domain/app/infra/EventBus';
import type { NoteVO } from '@shared/domain/model/note';
import type { ActionEvent, UpdateEvent as BaseUpdateEvent } from '../entity';

export enum Events {
  Updated = 'note.updated',
  Action = 'note.action',
}

export type UpdateEvent = BaseUpdateEvent<{
  title?: NoteVO['title'];
  icon?: NoteVO['icon'];
  parentId?: NoteVO['parentId'];
  body?: string;
  updatedAt?: number;
}>;

export type { ActionEvent } from '../entity';

export const eventBus = new EventBus<{
  [Events.Updated]: UpdateEvent;
  [Events.Action]: ActionEvent;
}>('note');
