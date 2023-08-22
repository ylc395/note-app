import { union, boolean, object, string, null as zodNull, type infer as Infer, array } from 'zod';
import uniqBy from 'lodash/uniqBy';

import type { Starable } from '../star';
import type { EntityId, EntityParentId } from '../entity';

const duplicatedNoteDTOSchema = object({ duplicateFrom: string() });

export const notePatchDTOSchema = object({
  title: string(),
  isReadonly: boolean(),
  parentId: union([zodNull(), string()]),
  icon: union([string().regex(/^(emoji:|file:).+/), zodNull()]),
}).partial();

export const notesPatchDTOSchema = array(notePatchDTOSchema.extend({ id: string() })).refine(
  (patches) => uniqBy(patches, 'id').length === patches.length,
);

export const newNoteDTOSchema = union([duplicatedNoteDTOSchema, notePatchDTOSchema]);

export const clientNoteQuerySchema = object({
  parentId: string().nullable().optional(),
});

export const noteBodySchema = string();

export type NewNoteDTO = Infer<typeof newNoteDTOSchema>;
export type NotesPatchDTO = Infer<typeof notesPatchDTOSchema>;
export type NotePatchDTO = Infer<typeof notePatchDTOSchema>;
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
