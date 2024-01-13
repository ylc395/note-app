import EventBus from '@domain/app/infra/EventBus';
import type { NoteVO } from '@shared/domain/model/note';

export enum Events {
  Updated = 'note.updated',
}

export interface UpdateEvent {
  id: NoteVO['id'];
  title?: NoteVO['title'];
  icon?: NoteVO['icon'];
  parentId?: NoteVO['parentId'];
  body?: string;
  updatedAt?: number;
}

export const eventBus = new EventBus<{
  [Events.Updated]: UpdateEvent;
}>('note');
