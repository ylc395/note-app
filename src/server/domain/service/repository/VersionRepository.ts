import type { EntityId } from '@domain/model/entity.js';
import type { Version } from '@domain/model/version.js';

export interface VersionRepository {
  create: (revision: Version) => Promise<Version>;
  findAllByEntityId: (id: EntityId) => Promise<Version[]>;
  getLatestRevisionTime: (id: EntityId) => Promise<number | null>;
}
