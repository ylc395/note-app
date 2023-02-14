import { object, array } from 'zod';
import { type EntityTypes, type EntityId, entityId } from './Entity';

export const starsDTOSchema = object({
  ids: array(entityId()).nonempty(),
});

export type StarsDTO = { ids: string[] };

export interface StarRecord {
  entityId: EntityId;
  entityType: EntityTypes;
  id: EntityId;
  title?: string;
}

export interface Starable {
  isStar: boolean;
}
