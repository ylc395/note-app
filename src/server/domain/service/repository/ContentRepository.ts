import type { Link, LinkDirection, LinkToQuery, Topic, TopicQuery } from 'model/content';
import type { EntityLocator } from 'model/entity';

export interface ContentRepository {
  createLinks: (links: Link[]) => Promise<void>;
  removeLinks: (entity: EntityLocator, direction?: LinkDirection) => Promise<void>;
  findAllLinkTos: (q: LinkToQuery) => Promise<Link[]>;
  createTopics: (topics: Topic[]) => Promise<void>;
  removeTopics: (entity: EntityLocator, inlineOnly: boolean) => Promise<void>;
  findAvailableTopicNames: (q?: { orderBy?: 'name' | 'updatedAt' }) => Promise<string[]>;
  findAvailableTopics: (q?: TopicQuery) => Promise<Topic[]>;
}
