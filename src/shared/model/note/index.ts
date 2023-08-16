import { union, boolean, object, string, null as zodNull, type infer as Infer, array } from 'zod';

import type { Starable } from '../star';
import type { EntityId, EntityParentId } from '../entity';

const duplicatedNoteDTOSchema = object({ duplicateFrom: string() });

export const ClientNotePatchSchema = object({
  title: string(),
  isReadonly: boolean(),
  parentId: union([zodNull(), string()]),
  icon: union([string().regex(/^(emoji:|file:).+/), zodNull()]),
}).partial();

export const ClientNotesPatchSchema = array(ClientNotePatchSchema.extend({ id: string() }));

export const ClientNewNoteSchema = union([duplicatedNoteDTOSchema, ClientNotePatchSchema]);

export const clientNoteQuerySchema = object({
  parentId: string().nullable().optional(),
});

export const noteBodySchema = string();

export type ClientNewNote = Infer<typeof ClientNewNoteSchema>;
export type ClientNotesPatch = Infer<typeof ClientNotesPatchSchema>;
export type ClientNotePatch = Infer<typeof ClientNotePatchSchema>;
export type DuplicateNote = Infer<typeof duplicatedNoteDTOSchema>;
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

export interface ClientNote extends Starable, Note {
  childrenCount: number;
}
