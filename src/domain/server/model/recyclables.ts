import type { EntityId } from '@domain/shared/model/entity.js';

export enum RecycleReason {
  Direct = 1,
  Cascade,
}

export interface RecyclableRecord {
  entityId: EntityId;
  deletedAt: number;
  reason: RecycleReason;
}

export * from '@domain/shared/model/recyclables.js';
