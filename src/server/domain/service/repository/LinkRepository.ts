import type { Link } from '@domain/model/content.js';
import type { EntityId } from '@domain/model/entity.js';

export interface LinkRepository {
  findAvailableLinksOf: (entityId: EntityId) => Promise<Required<Link>[]>;
  removeLinks: (sourceId: EntityId) => Promise<void>;
  createLinks: (links: Link[]) => Promise<void>;
}
