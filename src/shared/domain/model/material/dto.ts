import { object, string, type infer as Infer } from 'zod';
import { uniq } from 'lodash-es';

export const newMaterialDTOSchema = object({
  title: string().min(1).optional(),
  parentId: string().nullish(),
  icon: string().min(1).optional(),
  fileId: string().optional(),
  sourceUrl: string().url().optional(),
  comment: string().optional(),
});

export const materialPatchDTOSchema = newMaterialDTOSchema.omit({ fileId: true });

export const materialsPatchDTOSchema = object({
  ids: string().array().refine(uniq),
  material: materialPatchDTOSchema,
});

export type NewMaterialDTO = Infer<typeof newMaterialDTOSchema>;
export type MaterialsPatchDTO = Infer<typeof materialsPatchDTOSchema>;
export type MaterialPatchDTO = Infer<typeof materialPatchDTOSchema>;
