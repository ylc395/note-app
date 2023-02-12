import { object, string, array } from 'zod';

export const RecyclablesDTOSchema = object({
  ids: array(string()).nonempty(),
});

export type RecyclablesDTO = { ids: string[] };

export interface RecyclablesRecord {
  deletedAt: number;
  count: number;
}
