import EventBus from '#domain/client/app/infra/EventBus';
import type { NotePatchDTO, NoteVO } from '#domain/shared/model/note';
import type { UpdatedEvent as BaseUpdatedEvent } from '#domain/client/shared/model/entity';

export enum EventNames {
  Updated = 'updated',
  Removed = 'removed',
}

export type UpdateEvent = BaseUpdatedEvent<NotePatchDTO>;

type Events = {
  [EventNames.Updated]: UpdateEvent;
  [EventNames.Removed]: NoteVO;
};

export const eventBus = new EventBus<Events>('domain:notes');
