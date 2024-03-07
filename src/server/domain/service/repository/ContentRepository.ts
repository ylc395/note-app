import type { Link, LinkDirection, LinkToQuery, Topic, TopicQuery } from '@domain/model/content.js';
import type { EntityId } from '@domain/model/entity.js';

export interface ContentRepository {
  createLinks: (links: Link[]) => Promise<void>;
  removeLinks: (entity: EntityId, direction?: LinkDirection) => Promise<void>;
  findAllLinkTos: (q: LinkToQuery) => Promise<Link[]>;
  createTopics: (topics: Topic[]) => Promise<void>;
  removeTopicsOf: (entityId: EntityId) => Promise<void>;
  findAvailableTopicNames: (q?: { orderBy?: 'name' | 'updatedAt' }) => Promise<string[]>;
  findAvailableTopics: (q?: TopicQuery) => Promise<Topic[]>;
}
