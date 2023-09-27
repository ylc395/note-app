import type { RecyclableRecord, Recyclable, RecycleReason } from 'model/recyclables';
import type { EntityLocator } from 'model/entity';

export interface RecyclablesRepository {
  findAllByLocators: (entities: EntityLocator[]) => Promise<RecyclableRecord[]>; // not including hard deleted record
  findAll: (reason?: RecycleReason) => Promise<RecyclableRecord[]>; // not including hard deleted record
  batchCreate: (entities: Recyclable[]) => Promise<RecyclableRecord[]>;
  getHardDeletedRecord: (entity: EntityLocator) => Promise<RecyclableRecord | null>;
}
