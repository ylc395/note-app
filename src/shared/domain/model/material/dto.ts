import { object, string, type infer as Infer } from 'zod';

export const newMaterialDTOSchema = object({
  title: string().optional(),
  parentId: string().nullish(),
  icon: string().min(1).nullish(),
  fileId: string().optional(),
  sourceUrl: string().url().nullish(),
  comment: string().optional(),
});

export const materialPatchDTOSchema = newMaterialDTOSchema.omit({ fileId: true });

export type NewMaterialDTO = Infer<typeof newMaterialDTOSchema>;
export type MaterialPatchDTO = Infer<typeof materialPatchDTOSchema>;
