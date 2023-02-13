import { object, string, array } from 'zod';
import type { EntityTypes } from './Entity';

export const RecyclablesDTOSchema = object({
  ids: array(string()).nonempty(),
});

export type RecyclablesDTO = { ids: string[] };

export interface RecyclableRecord {
  deletedAt: number;
  entityType: EntityTypes;
  entityId: string;
}
