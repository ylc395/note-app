import type { RecyclableRecord, RecycleReason } from '@domain/model/recyclables.js';
import type { EntityLocator } from '@domain/model/entity.js';

export interface RecyclablesRepository {
  findAllByLocators: (entities: EntityLocator[], reason?: RecycleReason) => Promise<RecyclableRecord[]>; // not including hard deleted record
  findAll: (reason?: RecycleReason) => Promise<RecyclableRecord[]>; // not including hard deleted record
  batchCreate: (entities: RecyclableRecord[]) => Promise<RecyclableRecord[]>;
  batchRemove: (entities: EntityLocator[]) => Promise<void>;
}
