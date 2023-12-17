import { object, string, nativeEnum, preprocess, type infer as Infer } from 'zod';
import { MaterialTypes } from './base.js';

export const clientMaterialQuerySchema = object({
  parentId: string().nullable().optional(),
  type: preprocess((v) => Number(v), nativeEnum(MaterialTypes)).optional(),
  to: string().optional(),
});

export type ClientMaterialQuery = Infer<typeof clientMaterialQuerySchema>;
