import { nativeEnum } from 'zod';
import { pick } from 'lodash-es';

import { entityLocatorSchema, EntityTypes, type EntityWithTitle, type EntityLocator } from './entity.js';

export const recyclableDTOSchema = entityLocatorSchema.extend({
  entityType: nativeEnum(pick(EntityTypes, ['Note', 'Material', 'Memo'] as const)),
});

export const recyclablesDTOSchema = recyclableDTOSchema.array();

export type RecyclableEntityLocator = EntityLocator<RecyclableEntityTypes>;

export type RecyclableDTO = RecyclableEntityLocator;

export type RecyclablesDTO = RecyclableDTO[];

export type RecyclableEntityTypes = EntityTypes.Note | EntityTypes.Memo | EntityTypes.Material;

export enum RecycleReason {
  Direct = 1,
  Cascade,
}

export interface RecyclableVO extends EntityWithTitle<RecyclableEntityTypes> {
  deletedAt: number;
}
