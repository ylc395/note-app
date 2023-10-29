import type { RecycleReason, RecyclableVO } from 'shared/model/recyclables';

export type RecyclableRecord = Omit<RecyclableVO, 'title'> & { reason: RecycleReason };

export * from 'shared/model/recyclables';
