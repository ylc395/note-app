import type { EntityLocator } from 'model/entity';
import type { RecycleReason, RecyclableVO } from 'shard/model/recyclables';

export type Recyclable = EntityLocator & { reason: RecycleReason };
export type RecyclableRecord = Omit<RecyclableVO, 'title'> & { reason: RecycleReason };
export type RecyclableCreatedEvent = RecyclableRecord[];
export type RecyclableRemovedEvent = EntityLocator;

export * from 'shard/model/recyclables';
