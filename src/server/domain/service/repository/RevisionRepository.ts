import type { EntityLocator } from '@domain/model/entity';
import type { RevisionVO, Revision } from '@domain/model/revision';

export interface RevisionRepository {
  create: (revision: Revision) => Promise<RevisionVO>;
  findAll: (entity: EntityLocator) => Promise<RevisionVO[]>;
  getLatestRevisionTime: (entity: EntityLocator) => Promise<number | null>;
}
