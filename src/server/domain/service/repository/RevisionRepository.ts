import type { EntityLocator } from '@domain/model/entity.js';
import type { RevisionVO, Revision } from '@domain/model/revision.js';

export interface RevisionRepository {
  create: (revision: Revision) => Promise<RevisionVO>;
  findAll: (entity: EntityLocator) => Promise<RevisionVO[]>;
  getLatestRevisionTime: (entity: EntityLocator) => Promise<number | null>;
}
