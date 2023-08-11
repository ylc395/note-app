import type { EntityLocator } from 'model/entity';
import type { RecycleReason, RecyclableRecord } from 'shard/model/recyclables';

export type Recyclable = EntityLocator & { reason: RecycleReason };
export type RawRecyclableRecord = Omit<RecyclableRecord, 'title'> & { reason: RecycleReason };

export * from 'shard/model/recyclables';
