import type { EntityId, EntityLocator, EntityTypes } from '@domain/shared/model/entity.js';

export * from '@domain/shared/model/content/topic.js';
export * from '@domain/shared/model/content/link.js';

export enum EventNames {
  ContentUpdated = 'content.updated',
}

export interface ContentUpdatedEvent extends EntityLocator {
  content: string;
  updatedAt: number;
}

export type EventMaps = {
  [EventNames.ContentUpdated]: ContentUpdatedEvent;
};

export interface TopicRecord {
  entityType?: EntityTypes;
  entityId: EntityId;
  name: string;
  createdAt: number;
}

export interface Link {
  sourceId: EntityId;
  sourceType?: EntityTypes;
  targetId: EntityId;
  targetType?: EntityTypes;
}
