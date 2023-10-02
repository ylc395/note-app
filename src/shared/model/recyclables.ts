import { nativeEnum } from 'zod';
import pick from 'lodash/pick';

import {
  entityLocatorSchema,
  EntityTypes,
  type MainEntityTypes,
  type EntityWithTitle,
  type EntityLocator,
} from './entity';

const recyclableEntityTypes = pick(EntityTypes, ['Note', 'Material', 'Memo']);

export const recyclableDTOSchema = entityLocatorSchema.extend({
  entityType: nativeEnum(recyclableEntityTypes),
});

export const recyclablesDTOSchema = recyclableDTOSchema.array();

export type RecyclableEntityLocator = EntityLocator<RecyclableEntityTypes>;

export type RecyclableDTO = RecyclableEntityLocator;

export type RecyclablesDTO = RecyclableDTO[];

export type RecyclableEntityTypes = MainEntityTypes;

export enum RecycleReason {
  Direct = 1,
  Cascade,
}

export interface RecyclableVO extends EntityWithTitle<RecyclableEntityTypes> {
  deletedAt: number;
}
