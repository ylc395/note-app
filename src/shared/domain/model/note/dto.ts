import { boolean, object, string, type infer as Infer } from 'zod';

export const notePatchDTOSchema = object({
  title: string().optional(),
  isReadonly: boolean().optional(),
  parentId: string().nullish(),
  icon: string().nullish(),
});

export const newNoteDTOSchema = notePatchDTOSchema;

export type NewNoteDTO = Infer<typeof newNoteDTOSchema>;
export type NotePatchDTO = Infer<typeof notePatchDTOSchema>;
