import EventBus from '@domain/app/infra/EventBus';
import type { NoteVO } from '@shared/domain/model/note';

export enum Events {
  Updated = 'note.updated',
}

export interface UpdateEvent {
  id: NoteVO['id'];
  actor: unknown;
  title?: NoteVO['title'];
  icon?: NoteVO['icon'];
  parentId?: NoteVO['parentId'];
  body?: string;
}

export const eventBus = new EventBus<{
  [Events.Updated]: UpdateEvent;
}>('note');
