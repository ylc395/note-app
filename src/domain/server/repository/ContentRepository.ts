import type { LinkRecord, LinkTargetType, TopicRecord } from '#domain/server/model/content.js';
import type { EntityId, EntityTypes } from '#domain/shared/model/entity.js';

export interface LinkQuery {
  entityId?: EntityId | EntityId[];
  isAvailableOnly?: boolean;
  targetTypes?: LinkTargetType[];
  startEntityType?: EntityTypes;
  direction?: 'start' | 'end';
}

export interface TopicQuery {
  entityType?: EntityTypes;
  level?: TopicRecord['level'];
  isAvailableOnly?: boolean;
}

export interface ContentRepository {
  findAllLinks: (config: LinkQuery) => Promise<LinkRecord[]>;
  removeLinksOf: (sourceId: EntityId, as: 'source' | 'all') => Promise<void>;
  createLinks: (links: LinkRecord[]) => Promise<void>;
  createTopics: (topics: TopicRecord[]) => Promise<void>;
  removeTopicsOf: (entityId: EntityId) => Promise<void>;
  findAllTopics: (config?: TopicQuery) => Promise<TopicRecord[]>;
}
