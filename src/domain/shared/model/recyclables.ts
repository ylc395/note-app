import type { EntityId, EntityLocator } from './entity.js';

export interface RecyclableDTO {
  entityId: EntityId;
}

export type RecyclablesDTO = RecyclableDTO[];

export enum RecycleReason {
  Direct = 1,
  Cascade,
}

export interface RecyclableVO extends EntityLocator {
  title: string;
  deletedAt: number;
}
