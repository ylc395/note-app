import { object, string, infer as ZodInfer, array } from 'zod';

export const entitiesDTOSchema = object({
  ids: array(string()),
});

export type EntitiesDTO = ZodInfer<typeof entitiesDTOSchema>;
