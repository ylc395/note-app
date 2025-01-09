import EventBus from '#domain/client/shared/infra/EventBus';
import type { NoteVO } from '#domain/shared/model/note';

export enum EventNames {
  MoveStart = 'move.start',
}

export const eventBus = new EventBus<{
  [EventNames.MoveStart]: NoteVO[];
}>('domain:notes');
