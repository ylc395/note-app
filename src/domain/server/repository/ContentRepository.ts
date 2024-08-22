import type { LinkRecord, LinkTargetType, TopicRecord } from '@domain/server/model/content.js';
import type { EntityId } from '@domain/shared/model/entity.js';

export interface ContentRepository {
  findLinksOf: (
    entityId: EntityId | EntityId[],
    config?: { isAvailableOnly?: boolean; types?: LinkTargetType[] },
  ) => Promise<Required<LinkRecord>[]>;
  removeLinksOf: (sourceId: EntityId, as: 'source' | 'all') => Promise<void>;
  createLinks: (links: LinkRecord[]) => Promise<void>;
  createTopics: (topics: TopicRecord[]) => Promise<void>;
  removeTopicsOf: (entityId: EntityId) => Promise<void>;
  findAllTopics: (config?: { isAvailableOnly?: boolean }) => Promise<TopicRecord[]>;
}
