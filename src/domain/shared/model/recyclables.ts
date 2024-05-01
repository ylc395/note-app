import { object, string } from 'zod';

import type { EntityId, EntityLocator } from './entity.js';

export const recyclableDTOSchema = object({ entityId: string() });

export const recyclablesDTOSchema = recyclableDTOSchema.array();

export type RecyclableDTO = { entityId: EntityId };

export type RecyclablesDTO = RecyclableDTO[];

export enum RecycleReason {
  Direct = 1,
  Cascade,
}

export interface RecyclableVO extends EntityLocator {
  title: string;
  deletedAt: number;
}
