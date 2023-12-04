import { nativeEnum } from 'zod';
import pick from 'lodash/pick';

import { type EntityId, type EntityWithTitle, type EntityLocator, entityLocatorSchema, EntityTypes } from './entity';

export const starsDTOSchema = entityLocatorSchema
  .extend({ entityType: nativeEnum(pick(EntityTypes, ['Material', 'Memo', 'Note', 'MaterialAnnotation'] as const)) })
  .array();

export type StarEntityTypes =
  | EntityTypes.Material
  | EntityTypes.MaterialAnnotation
  | EntityTypes.Memo
  | EntityTypes.Note;

export type StarEntityLocator = EntityLocator<StarEntityTypes>;

export type StarsDTO = StarEntityLocator[];

export interface StarVO extends EntityWithTitle<StarEntityTypes> {
  id: EntityId;
}

export interface Starable {
  isStar: boolean;
}
