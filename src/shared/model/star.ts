import { nativeEnum } from 'zod';
import pick from 'lodash/pick';

import { type EntityId, type EntityWithTitle, type EntityLocator, entityLocatorSchema, EntityTypes } from './entity';

const starEntityTypes = pick(EntityTypes, ['Material', 'Memo', 'Note', 'MaterialAnnotation']);

export const starsDTOSchema = entityLocatorSchema.extend({ entityType: nativeEnum(starEntityTypes) }).array();

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
