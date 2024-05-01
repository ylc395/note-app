import type { TopicRecord } from '@domain/server/model/content.js';
import type { EntityId } from '@domain/shared/model/entity.js';

export interface Topics {
  names: TopicRecord['name'][];
  createdAt: TopicRecord['createdAt'];
}

export interface TopicRepository {
  findTopicsOf: (entityId: EntityId) => Promise<TopicRecord[]>;
  createTopics: (entityId: EntityId, topics: Topics) => Promise<void>;
  removeTopics: (entityId: EntityId, names: TopicRecord['name'][]) => Promise<void>;
  findAllAvailableTopics: () => Promise<Required<TopicRecord>[]>;
}
