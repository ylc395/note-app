import type { RecycleReason, RecyclableVO } from 'shard/model/recyclables';

export type RecyclableRecord = Omit<RecyclableVO, 'title'> & { reason: RecycleReason };

export * from 'shard/model/recyclables';
