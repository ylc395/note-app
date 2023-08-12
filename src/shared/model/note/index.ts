import { union, boolean, object, string, null as zodNull, type infer as Infer, array } from 'zod';

import type { Starable } from '../star';
import type { EntityId } from '../entity';

const duplicatedNoteDTOSchema = object({ duplicateFrom: string() });
export const noteDTOSchema = object({
  title: string(),
  isReadonly: boolean(),
  parentId: union([zodNull(), string()]),
  icon: union([string().regex(/^(emoji:|file:).+/), zodNull()]),
}).partial();

export const NewNoteDTOSchema = union([duplicatedNoteDTOSchema, noteDTOSchema]);

export const notesDTOSchema = array(noteDTOSchema.extend({ id: string() }));

export const clientNoteQuerySchema = object({
  parentId: string().nullable().optional(),
});

export const noteBodySchema = object({
  content: string(),
  isImportant: boolean().optional(),
});

export type NewNoteDTO = Infer<typeof NewNoteDTOSchema>;
export type NotesDTO = Infer<typeof notesDTOSchema>;
export type DuplicateNoteDTO = Infer<typeof duplicatedNoteDTOSchema>;
export type NoteDTO = Infer<typeof noteDTOSchema>;
export type NoteBodyDTO = Infer<typeof noteBodySchema>;
export type NoteBodyVO = NoteBodyDTO['content'];
export type ClientNoteQuery = Infer<typeof clientNoteQuerySchema>;

export interface NoteVO extends Starable {
  title: string;
  isReadonly: boolean;
  id: EntityId;
  parentId: NoteVO['id'] | null;
  icon: string | null;
  updatedAt: number;
  createdAt: number;
  childrenCount: number;
}
