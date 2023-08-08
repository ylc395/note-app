import type { RecyclableRecord, RecycleReason } from 'interface/recyclables';
import type { EntityLocator } from 'interface/entity';

export type Recyclable = EntityLocator & { reason: RecycleReason };

export interface RecyclablesRepository {
  findAllByLocators: (entities: EntityLocator[]) => Promise<RecyclableRecord[]>; // not including hard deleted record
  findAll: (reason?: RecycleReason) => Promise<RecyclableRecord[]>; // not including hard deleted record
  batchCreate: (entities: Recyclable[]) => Promise<RecyclableRecord[]>;
  getHardDeletedRecord: (entity: EntityLocator) => Promise<RecyclableRecord | null>;
}
