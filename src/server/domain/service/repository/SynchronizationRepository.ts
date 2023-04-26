import type { EntityLocator } from 'interface/entity';

export interface SynchronizationRepository {
  getLastFinishedSyncTimestamp: () => Promise<number | null>;
  updateLastFinishedSyncTimestamp: () => Promise<number>;
  getEntitySyncAt: (entity: EntityLocator) => Promise<number | null>;
}
