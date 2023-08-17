import { union, boolean, object, string, null as zodNull, type infer as Infer, array } from 'zod';

import type { Starable } from '../star';
import type { EntityId, EntityParentId } from '../entity';

const duplicatedNoteDTOSchema = object({ duplicateFrom: string() });

export const NotePatchDTOSchema = object({
  title: string(),
  isReadonly: boolean(),
  parentId: union([zodNull(), string()]),
  icon: union([string().regex(/^(emoji:|file:).+/), zodNull()]),
}).partial();

export const NotesPatchDTOSchema = array(NotePatchDTOSchema.extend({ id: string() }));

export const NewNoteDTOSchema = union([duplicatedNoteDTOSchema, NotePatchDTOSchema]);

export const clientNoteQuerySchema = object({
  parentId: string().nullable().optional(),
});

export const noteBodySchema = string();

export type NewNoteDTO = Infer<typeof NewNoteDTOSchema>;
export type NotesPatchDTO = Infer<typeof NotesPatchDTOSchema>;
export type NotePatchDTO = Infer<typeof NotePatchDTOSchema>;
export type DuplicateNoteDTO = Infer<typeof duplicatedNoteDTOSchema>;
export type NoteBody = Infer<typeof noteBodySchema>;
export type ClientNoteQuery = Infer<typeof clientNoteQuerySchema>;

export interface Note {
  title: string;
  isReadonly: boolean;
  id: EntityId;
  parentId: EntityParentId;
  icon: string | null;
  updatedAt: number;
  createdAt: number;
}

export interface NoteVO extends Starable, Note {
  childrenCount: number;
}
