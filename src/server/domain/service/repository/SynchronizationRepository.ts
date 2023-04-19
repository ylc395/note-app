import type { EntityLocator } from 'interface/entity';

export interface SynchronizationRepository {
  getLastFinishedSyncId: () => Promise<string | null>;
  updateLastFinishedSyncId: (id: string) => Promise<void>;
  hasEntitySyncRecord: (entityId: string, syncId: string) => Promise<boolean>;
  getLocalEntities: () => Promise<EntityLocator[]>;
}
