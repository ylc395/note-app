import { createTypedListener } from 'nest-typed-event-emitter';
import type { EntityLocator } from 'model/entity';

export enum Events {
  ContentUpdated = 'content.updated',
}

export type ContentUpdatedEvent = EntityLocator & { isImportant?: boolean; content: string };

export interface EventMaps {
  [Events.ContentUpdated]: ContentUpdatedEvent;
}

export const OnEvent = createTypedListener<EventMaps, true>();
