import type { Link } from '@domain/server/model/content.js';
import type { EntityId } from '@domain/shared/model/entity.js';

export interface LinkRepository {
  findAvailableLinksOf: (entityId: EntityId) => Promise<Required<Link>[]>;
  removeLinks: (sourceId: EntityId) => Promise<void>;
  createLinks: (links: Link[]) => Promise<void>;
}
