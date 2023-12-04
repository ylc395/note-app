import { union, boolean, object, string, null as zodNull, type infer as Infer, undefined as zodUndefined } from 'zod';

export const notePatchDTOSchema = object({
  title: string(),
  isReadonly: boolean(),
  body: string(),
  parentId: union([zodNull(), string()]),
  icon: union([string().regex(/^(emoji:|file:).+/), zodNull()]),
}).partial();

export const notesPatchDTOSchema = object({
  ids: string()
    .array()
    .refine((ids) => new Set(ids).size === ids.length),
  note: notePatchDTOSchema,
});

export const newNoteDTOSchema = union([notePatchDTOSchema, zodUndefined()]);

export const newNoteParamsSchema = object({ from: string().optional() });

export type NewNoteDTO = Infer<typeof newNoteDTOSchema>;
export type NotesPatchDTO = Infer<typeof notesPatchDTOSchema>;
export type NotePatchDTO = Infer<typeof notePatchDTOSchema>;
export type NewNoteParams = Infer<typeof newNoteParamsSchema>;
