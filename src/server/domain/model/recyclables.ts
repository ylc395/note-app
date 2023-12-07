import type { RecycleReason, RecyclableVO } from '@shared/domain/model/recyclables.js';

export type RecyclableRecord = Omit<RecyclableVO, 'title'> & { reason: RecycleReason };

export * from '@shared/domain/model/recyclables.js';
