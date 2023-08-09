import type { EntityLocator } from 'model/entity';

export interface SynchronizationRepository {
  getLastFinishedSyncTimestamp: () => Promise<number | null>;
  updateLastFinishedSyncTimestamp: (time: number) => Promise<void>;
  getEntitySyncAt: (entity: EntityLocator) => Promise<number | null>;
  updateEntitySyncAt: (entity: EntityLocator, syncAt: number) => Promise<void>;
}
