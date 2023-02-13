import { object, array, string } from 'zod';
import type { EntityTypes } from './Entity';

export const starsDTOSchema = object({
  ids: array(string()).nonempty(),
});

export type StarsDTO = { ids: string[] };

export interface StarRecord {
  id: string;
  type: EntityTypes;
}
