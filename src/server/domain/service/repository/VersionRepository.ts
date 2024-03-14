import type { EntityId } from '@domain/model/entity.js';
import type { IndexRange, Version } from '@domain/model/version.js';

export interface VersionRepository {
  create: (revision: Version) => Promise<Version>;
  remove: (entityId: EntityId, range: IndexRange) => Promise<void>;
  findAllByEntityId: (id: EntityId, till?: Version['index']) => Promise<Version[]>;
  findLatest: (id: EntityId) => Promise<Version | null>;
}
