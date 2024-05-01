import type { RecycleReason, RecyclableVO } from '@domain/shared/model/recyclables.js';

export type RecyclableRecord = Omit<RecyclableVO, 'title'> & { reason: RecycleReason };

export * from '@domain/shared/model/recyclables.js';
