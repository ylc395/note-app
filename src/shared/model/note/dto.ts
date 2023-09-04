import { union, boolean, object, string, null as zodNull, type infer as Infer } from 'zod';

const duplicatedNoteDTOSchema = object({ duplicateFrom: string() });

export const notePatchDTOSchema = object({
  title: string(),
  isReadonly: boolean(),
  parentId: union([zodNull(), string()]),
  icon: union([string().regex(/^(emoji:|file:).+/), zodNull()]),
}).partial();

export const notesPatchDTOSchema = object({
  ids: string()
    .array()
    .refine((ids) => new Set(ids).size === ids.length),
  note: notePatchDTOSchema,
});

export const newNoteDTOSchema = union([duplicatedNoteDTOSchema, notePatchDTOSchema]);
export const noteBodyDTOSchema = string();
export type NewNoteDTO = Infer<typeof newNoteDTOSchema>;
export type NotesPatchDTO = Infer<typeof notesPatchDTOSchema>;
export type NotePatchDTO = Infer<typeof notePatchDTOSchema>;
export type DuplicateNoteDTO = Infer<typeof duplicatedNoteDTOSchema>;
export type NoteBodyDTO = Infer<typeof noteBodyDTOSchema>;
