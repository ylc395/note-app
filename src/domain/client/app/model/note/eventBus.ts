import EventBus from '@domain/client/app/infra/EventBus';
import type { NoteVO } from '@domain/shared/model/note';
import type { UpdateEvent as BaseUpdateEvent } from '../entity';

export enum Events {
  Updated = 'updated',
}

export type UpdateEvent = BaseUpdateEvent<NoteVO>;

export const eventBus = new EventBus<{
  [Events.Updated]: UpdateEvent;
}>('note');
