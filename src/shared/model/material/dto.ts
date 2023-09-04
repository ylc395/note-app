import { object, string, type infer as Infer } from 'zod';

export const newMaterialDirectoryDTOSchema = object({
  name: string().min(1).optional(),
  parentId: string().nullable().optional(),
  icon: string().min(1).optional(),
});

export const newMaterialEntityDTOSchema = newMaterialDirectoryDTOSchema.extend({
  fileId: string(),
  sourceUrl: string().url().optional(),
});

export const newMaterialDTOSchema = newMaterialEntityDTOSchema.or(newMaterialDirectoryDTOSchema);

const materialDirectoryPatchDTOSchema = newMaterialDirectoryDTOSchema;
const materialEntityPatchDTOSchema = newMaterialEntityDTOSchema.omit({ fileId: true });

export type MaterialPatchDTO =
  | Infer<typeof materialDirectoryPatchDTOSchema>
  | Infer<typeof materialEntityPatchDTOSchema>;

export const materialsPatchDTOSchema = object({
  ids: string()
    .array()
    .refine((ids) => new Set(ids).size === ids.length),
  material: materialEntityPatchDTOSchema.or(materialDirectoryPatchDTOSchema),
});

export type NewMaterialEntityDTO = Infer<typeof newMaterialEntityDTOSchema>;

export type NewMaterialDTO = Infer<typeof newMaterialDirectoryDTOSchema> | NewMaterialEntityDTO;

export const isNewMaterialEntity = (
  newMaterial: NewMaterialDTO,
): newMaterial is Infer<typeof newMaterialEntityDTOSchema> => {
  return 'fileId' in newMaterial;
};

export type MaterialsPatchDTO = Infer<typeof materialsPatchDTOSchema>;
