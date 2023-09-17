import type { Link, Topic } from 'model/content';
import type { EntityLocator } from 'model/entity';

export interface ContentRepository {
  createLinks: (links: Link[]) => Promise<void>;
  removeLinks: (entity: EntityLocator, type: 'from' | 'to') => Promise<void>;
  createTopics: (topics: Topic[]) => Promise<void>;
  removeTopics: (entity: EntityLocator) => Promise<void>;
}
