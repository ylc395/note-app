import { Emitter } from 'strict-event-emitter';
import type { ContentUpdatedEvent } from 'model/content';
import type { RecyclableCreatedEvent, RecyclableRemovedEvent } from 'model/recyclables';

export const eventBus = new Emitter<{
  contentUpdated: [ContentUpdatedEvent];
  recyclableCreated: [RecyclableCreatedEvent];
  recyclableRemoved: [RecyclableRemovedEvent];
}>();

export type EventBus = typeof eventBus;

export const token = Symbol();
