import { union, boolean, object, string, null as zodNull, type infer as Infer, array } from 'zod';
import dayjs from 'dayjs';

import type { Starable } from './star';
import type { EntityId } from './entity';

export const noteDTOSchema = object({
  title: string(),
  isReadonly: boolean(),
  parentId: union([zodNull(), string()]),
  icon: union([string().regex(/^(emoji:|file:).+/), zodNull()]),
  duplicateFrom: string(),
}).partial();

export const notesDTOSchema = array(noteDTOSchema.extend({ id: string() }).omit({ duplicateFrom: true }));

export type NotesDTO = Infer<typeof notesDTOSchema>;

export type NoteDTO = Infer<typeof noteDTOSchema>;

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

export const noteQuerySchema = object({
  parentId: union([zodNull(), string()]).optional(),
});

export const noteBodySchema = object({
  content: string(),
  isImportant: boolean().optional(),
});

export type NoteBodyDTO = Infer<typeof noteBodySchema>;

export type NoteBodyVO = NoteBodyDTO['content'];

export type NoteQuery = Infer<typeof noteQuerySchema>;

export function normalizeTitle(note?: Pick<NoteVO, 'title' | 'createdAt'>) {
  if (!note) {
    return '';
  }

  return note.title || `未命名笔记-${dayjs.unix(note.createdAt).format('YYYYMMDD-HHmm')}`;
}
