import type { RecyclableRecord, Recyclable, RecycleReason } from 'model/recyclables';
import type { EntityLocator } from 'model/entity';

export interface RecyclablesRepository {
  findAllByLocators: (entities: EntityLocator[], reason?: RecycleReason) => Promise<RecyclableRecord[]>; // not including hard deleted record
  findAll: (reason?: RecycleReason) => Promise<RecyclableRecord[]>; // not including hard deleted record
  batchCreate: (entities: Recyclable[]) => Promise<RecyclableRecord[]>;
  batchRemove: (entities: EntityLocator[]) => Promise<void>;
  getHardDeletedRecord: (entity: EntityLocator) => Promise<RecyclableRecord | null>;
}
