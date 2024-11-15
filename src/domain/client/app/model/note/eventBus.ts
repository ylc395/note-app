import EventBus from '#domain/client/app/infra/EventBus';
import type { NotePatchDTO, NoteVO } from '#domain/shared/model/note';

export enum Events {
  Updated = 'updated',
}

export interface UpdateEvent {
  id: NoteVO['id'];
  payload: NotePatchDTO;
  trigger: unknown;
}

export const eventBus = new EventBus<{ [Events.Updated]: UpdateEvent }>('domain:notes');
