import type { EntityId } from '#domain/shared/model/entity.js';

export interface RecyclableRecord {
  entityId: EntityId;
  createdAt: number;
}

export * from '#domain/shared/model/recyclable.js';
