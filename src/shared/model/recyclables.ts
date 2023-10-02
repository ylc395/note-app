import { nativeEnum } from 'zod';
import pick from 'lodash/pick';

import {
  entityLocatorSchema,
  EntityTypes,
  type MainEntityTypes,
  type EntityWithTitle,
  type EntityLocator,
} from './entity';

export const recyclableDTOSchema = entityLocatorSchema.extend({
  entityType: nativeEnum(pick(EntityTypes, ['Note', 'Material', 'Memo'])),
});

export const recyclablesDTOSchema = recyclableDTOSchema.array();

export type RecyclableDTO = RecyclableEntity;

export type RecyclablesDTO = RecyclableDTO[];

export type RecyclableEntityTypes = MainEntityTypes;

export type RecyclableEntity = EntityLocator<RecyclableEntityTypes>;

export enum RecycleReason {
  Direct = 1,
  Cascade,
}

export interface RecyclableVO extends EntityWithTitle<RecyclableEntityTypes> {
  deletedAt: number;
}
