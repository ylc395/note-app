import type { RecyclableRecord, RecycleReason } from 'interface/recyclables';
import type { EntityLocator } from 'interface/entity';

export type Recyclable = EntityLocator & { reason: RecycleReason };

type RawRecyclableRecord = RecyclableRecord & { reason: RecycleReason };

export interface RecyclablesRepository {
  findAllByLocators: (entities: EntityLocator[]) => Promise<RawRecyclableRecord[]>; // not including hard deleted record
  findAll: (reason?: RecycleReason) => Promise<RawRecyclableRecord[]>; // not including hard deleted record
  batchCreate: (entities: Recyclable[]) => Promise<RawRecyclableRecord[]>;
  getHardDeletedRecord: (entity: EntityLocator) => Promise<RawRecyclableRecord | null>;
}
