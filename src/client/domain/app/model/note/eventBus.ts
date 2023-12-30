import { Emitter } from 'strict-event-emitter';
import type { NoteVO } from '@shared/domain/model/note';

export enum Events {
  Updated = 'note.updated',
  Action = 'note.action',
}

export interface UpdateEvent {
  id: NoteVO['id'];
  title?: NoteVO['title'];
  icon?: NoteVO['icon'];
  parentId?: NoteVO['parentId'];
  body?: string;
}

export interface ActionEvent {
  action: string;
  id: NoteVO['id'][];
}

export default new Emitter<{
  [Events.Updated]: [UpdateEvent];
  [Events.Action]: [ActionEvent];
}>().setMaxListeners(Infinity);
