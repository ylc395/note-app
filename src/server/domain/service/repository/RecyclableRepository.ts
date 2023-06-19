import type { RecyclableRecord } from 'interface/recyclables';
import type { EntityTypes, EntityId, EntityLocator } from 'interface/entity';

export type DeletedRecord = EntityLocator & { deletedAt: number };

export interface RecyclablesRepository {
  put: (type: EntityTypes, ids: EntityId[]) => Promise<RecyclableRecord[]>;
  // not including hard deleted record
  findOneByLocator: (entity: EntityLocator) => Promise<RecyclableRecord | null>;
  // not including hard deleted record
  findAllByLocator: (type: EntityTypes, ids: EntityId[]) => Promise<RecyclableRecord[]>;
  getHardDeletedRecord: (entity: EntityLocator) => Promise<DeletedRecord | null>;
}
