import { object, string, type infer as Infer, union } from 'zod';
import { uniq } from 'lodash-es';

const newMaterialDirectoryDTOSchema = object({
  title: string().min(1).optional(),
  parentId: string().nullish(),
  icon: string().min(1).optional(),
});

const newMaterialEntityDTOSchema = newMaterialDirectoryDTOSchema.extend({
  fileId: string(),
  sourceUrl: string().url().optional(),
  comment: string().optional(),
});

const materialCommonPatchDTOSchema = newMaterialDirectoryDTOSchema;

export const newMaterialDTOSchema = union([newMaterialEntityDTOSchema, newMaterialDirectoryDTOSchema]);

export const materialPatchDTOSchema = newMaterialEntityDTOSchema.omit({ fileId: true });

export const materialsPatchDTOSchema = object({
  ids: string().array().refine(uniq),
  material: materialCommonPatchDTOSchema,
});

export type NewMaterialEntityDTO = Infer<typeof newMaterialEntityDTOSchema>;
export type NewMaterialDTO = Infer<typeof newMaterialDirectoryDTOSchema> | NewMaterialEntityDTO;
export type MaterialsPatchDTO = Infer<typeof materialsPatchDTOSchema>;
export type MaterialPatchDTO = Infer<typeof materialPatchDTOSchema>;

export const isNewMaterialEntity = (newMaterial: NewMaterialDTO): newMaterial is NewMaterialEntityDTO => {
  return 'fileId' in newMaterial;
};
