import { object, array, string } from 'zod';
import type { EntityTypes } from './Entity';

export const starsDTOSchema = object({
  ids: array(string()).nonempty(),
});

export type StarsDTO = { ids: string[] };

export interface StarRecord {
  entityId: string;
  entityType: EntityTypes;
  id: string;
  title?: string;
}

export interface Starable {
  isStar: boolean;
}
