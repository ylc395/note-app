import { object, string, nativeEnum, preprocess, type infer as Infer } from 'zod';
import { MaterialTypes } from './base';

export const clientMaterialQuerySchema = object({
  parentId: string().nullable().optional(),
  type: preprocess((v) => v && Number(v), nativeEnum(MaterialTypes).optional()),
});

export type ClientMaterialQuery = Infer<typeof clientMaterialQuerySchema>;
