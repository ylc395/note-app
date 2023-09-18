import type { EntityLocator } from 'model/entity';
import type { RevisionVO, Revision } from 'model/revision';

export interface RevisionRepository {
  create: (revision: Revision) => Promise<RevisionVO>;
  findAll: (entity: EntityLocator) => Promise<RevisionVO[]>;
  getLatestRevisionTime: (entity: EntityLocator) => Promise<number | null>;
}
