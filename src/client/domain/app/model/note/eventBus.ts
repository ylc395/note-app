import { Emitter } from 'strict-event-emitter';
import type { Note } from '@shared/domain/model/note';

export enum Events {
  Updated = 'note.updated',
}

export interface UpdateEvent {
  id: Note['id'];
  title?: Note['title'];
  body?: Note['body'];
  parentId?: Note['parentId'];
}

export default new Emitter<{
  [Events.Updated]: [UpdateEvent];
}>();
