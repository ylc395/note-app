import { uniq } from 'lodash-es';
import { boolean, object, string, type infer as Infer } from 'zod';

export const notePatchDTOSchema = object({
  title: string().optional(),
  isReadonly: boolean().optional(),
  body: string().optional(),
  parentId: string().nullish(),
  icon: string()
    .regex(/^(emoji:|file:).+/)
    .nullish(),
});

export const notesPatchDTOSchema = object({
  ids: string().array().refine(uniq),
  note: notePatchDTOSchema,
});

export const newNoteDTOSchema = notePatchDTOSchema.optional();
export const newNoteParamsSchema = object({ from: string().optional() });

export type NewNoteDTO = Infer<typeof newNoteDTOSchema>;
export type NotesPatchDTO = Infer<typeof notesPatchDTOSchema>;
export type NotePatchDTO = Infer<typeof notePatchDTOSchema>;
export type NewNoteParams = Infer<typeof newNoteParamsSchema>;
