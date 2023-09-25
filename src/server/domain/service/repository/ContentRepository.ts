import type { Link, Topic, TopicQuery } from 'model/content';
import type { EntityLocator } from 'model/entity';

export interface ContentRepository {
  createLinks: (links: Link[]) => Promise<void>;
  removeLinks: (entity: EntityLocator, type: 'from' | 'to') => Promise<void>;
  createTopics: (topics: Topic[]) => Promise<void>;
  removeTopics: (entity: EntityLocator) => Promise<void>;
  findAllTopicNames: (q?: { orderBy?: 'name' | 'updatedAt' }) => Promise<string[]>;
  findAllTopics: (q?: TopicQuery) => Promise<Topic[]>;
}
