import type { EntityLocator } from 'interface/entity';

export enum Events {
  ContentUpdated = 'content.updated',
}

export type ContentUpdatedEvent = EntityLocator & { isImportant?: boolean; content: string };

export type EventMap = {
  [Events.ContentUpdated]: (e: ContentUpdatedEvent) => void;
};
