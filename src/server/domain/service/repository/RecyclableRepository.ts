import type { RecyclableRecord, RecycleReason } from '@domain/model/recyclables';
import type { EntityLocator } from '@domain/model/entity';

export interface RecyclablesRepository {
  findAllByLocators: (entities: EntityLocator[], reason?: RecycleReason) => Promise<RecyclableRecord[]>; // not including hard deleted record
  findAll: (reason?: RecycleReason) => Promise<RecyclableRecord[]>; // not including hard deleted record
  batchCreate: (entities: RecyclableRecord[]) => Promise<RecyclableRecord[]>;
  batchRemove: (entities: EntityLocator[]) => Promise<void>;
}
