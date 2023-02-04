import { object, string, infer as ZodInfer, array } from 'zod';

export const entitiesDTOSchema = object({
  ids: array(string()),
});

export type RecyclableEntitiesDTO = ZodInfer<typeof entitiesDTOSchema>;

export interface RecycleRecord {
  deletedAt?: number;
  count: number;
}

export type RecyclableEntityVO<T> = T & { deletedAt: number };
