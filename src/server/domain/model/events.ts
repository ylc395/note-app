import { createTypedListener } from 'nest-typed-event-emitter';
import type { EntityLocator } from 'interface/entity';

export enum Events {
  ContentUpdated = 'content.updated',
  RecyclablesCreated = 'recyclables.created',
  RecyclablesRemoved = 'recyclables.removed',
}

export type ContentUpdatedEvent = EntityLocator & { isImportant?: boolean; content: string };

export interface EventMaps {
  [Events.ContentUpdated]: ContentUpdatedEvent;
  [Events.RecyclablesCreated]: EntityLocator[];
  [Events.RecyclablesRemoved]: EntityLocator[];
}

export const OnEvent = createTypedListener<EventMaps, true>();
