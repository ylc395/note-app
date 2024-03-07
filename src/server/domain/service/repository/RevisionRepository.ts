import type { EntityId } from '@domain/model/entity.js';
import type { RevisionVO, Revision } from '@domain/model/revision.js';

export interface RevisionRepository {
  create: (revision: Revision) => Promise<Revision>;
  findAllByEntityId: (id: EntityId) => Promise<RevisionVO[]>;
  getLatestRevisionTime: (id: EntityId) => Promise<number | null>;
}
