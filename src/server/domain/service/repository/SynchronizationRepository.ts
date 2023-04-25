import type { EntityLocator } from 'interface/entity';

export interface SynchronizationRepository {
  getLastFinishedSyncTimestamp: () => Promise<number | null>;
  getEntitySyncAt: (entity: EntityLocator) => Promise<number | null>;
  getLocalEntities: () => Promise<(EntityLocator & { updatedAt: number; createdAt: number })[]>;
}
