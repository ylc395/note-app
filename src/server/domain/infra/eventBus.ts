import { Emitter } from 'strict-event-emitter';
import type { ContentUpdatedEvent } from '@domain/model/content';
import type { Config } from '@domain/model/config';

type EventMaps = {
  contentUpdated: [ContentUpdatedEvent];
};

type ConfigEventMaps = Required<{
  [key in keyof Config]: [Required<Config>[key]];
}>;

export type EventBus = Emitter<EventMaps> & { appConfig: Emitter<ConfigEventMaps> };

export const eventBus = new Emitter();
(eventBus as EventBus).appConfig = new Emitter();

export const token = Symbol();
