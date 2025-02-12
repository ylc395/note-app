import type { LinkRecord, LinkTargetType, TopicRecord } from '#domain/server/model/content.js';
import type { EntityId, EntityTypes } from '#domain/shared/model/entity.js';

export interface LinkQuery {
  entityId: EntityId | EntityId[];
  isAvailableOnly?: boolean;
  types?: LinkTargetType[];
  direction?: 'start' | 'end';
}

export interface TopicQuery {
  entityType?: EntityTypes; // 若不传该参数，仅查找 level 为全局的话题
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
