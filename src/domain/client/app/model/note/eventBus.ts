import EventBus from '#domain/client/app/infra/EventBus';
import type { NotePatchDTO, NoteVO } from '#domain/shared/model/note';

export enum EventNames {
  Updated = 'updated',
  Removed = 'removed',
}

export interface UpdateEvent {
  id: NoteVO['id'];
  payload: NotePatchDTO;
  trigger: unknown;
}

type Events = {
  [EventNames.Updated]: UpdateEvent;
  [EventNames.Removed]: NoteVO;
};

export const eventBus = new EventBus<Events>('domain:notes');
