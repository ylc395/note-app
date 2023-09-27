import { Emitter } from 'strict-event-emitter';
import type { ContentUpdatedEvent } from 'model/content';

export const eventEmitter = new Emitter<{
  contentUpdated: [ContentUpdatedEvent];
}>();

export type EventEmitter = typeof eventEmitter;

export const token = Symbol();
