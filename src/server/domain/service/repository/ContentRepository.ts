import type { Link } from 'model/content';
import type { EntityLocator } from 'model/entity';

export interface ContentRepository {
  createLinks: (links: Link[]) => Promise<void>;
  removeLinks: (entity: EntityLocator, type: 'from' | 'to') => Promise<void>;
  createTopics: () => Promise<void>;
  removeTopics: (entity: EntityLocator) => Promise<void>;
}
