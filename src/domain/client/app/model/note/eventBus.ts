import EventBus from '#domain/client/app/infra/EventBus';
import type { NotePatchDTO, NoteVO } from '#domain/shared/model/note';

export interface UpdatedEvent {
  id: NoteVO['id'];
  payload: NotePatchDTO;
}

export enum EventNames {
  Created = 'note.created',
  Updated = 'note.updated',
  Removed = 'note.removed',
}

export const eventBus = new EventBus<{
  [EventNames.Updated]: UpdatedEvent;
  [EventNames.Created]: NoteVO;
  [EventNames.Removed]: NoteVO['id'];
}>('domain:notes');
