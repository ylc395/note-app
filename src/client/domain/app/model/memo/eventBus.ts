import EventBus from '@domain/app/infra/EventBus';
import type { NoteVO } from '@shared/domain/model/note';
import type { UpdateEvent as BaseUpdateEvent } from '../entity';

export enum Events {
  Updated = 'updated',
}

export type UpdateEvent = BaseUpdateEvent<NoteVO>;

export default new EventBus<{
  [Events.Updated]: UpdateEvent;
}>('memo');
