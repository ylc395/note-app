import type { RecyclableRecord } from 'interface/recyclables';
import type { EntityTypes, EntityId, EntityLocator } from 'interface/entity';

export type DeletedRecord = EntityLocator & { deletedAt: number };

export interface RecyclablesRepository {
  put: (type: EntityTypes, ids: EntityId[]) => Promise<RecyclableRecord[]>;
  isRecyclable: (entity: EntityLocator) => Promise<boolean>;
  areRecyclable: (type: EntityTypes, ids: EntityLocator['id'][]) => Promise<Record<EntityLocator['id'], boolean>>;
  getHardDeletedRecord: (entity: EntityLocator) => Promise<DeletedRecord | null>;
}
