import { union, boolean, number, object, string, null as zodNull, type infer as Infer, array, record } from 'zod';
import dayjs from 'dayjs';

import type { Starable } from './star';
import type { EntityId } from './entity';

export const noteDTOSchema = object({
  title: string().optional(),
  isReadonly: boolean().optional(),
  userUpdatedAt: number().optional(),
  userCreatedAt: number().optional(),
  parentId: union([zodNull(), string()]).optional(),
  icon: union([string().regex(/^(emoji:|file:).+/), zodNull()]).optional(),
  duplicateFrom: string().optional(),
  attributes: record(string().min(1), string().min(1)).optional(),
});

export const notesDTOSchema = array(noteDTOSchema.extend({ id: string() }).omit({ duplicateFrom: true }));

export type NotesDTO = Infer<typeof notesDTOSchema>;

export type NoteDTO = Infer<typeof noteDTOSchema>;

export type NoteVO = {
  title: string;
  isReadonly: boolean;
  id: EntityId;
  parentId: NoteVO['id'] | null;
  icon: string | null;
  childrenCount: number;
  updatedAt: number;
  userUpdatedAt: number;
  createdAt: number;
  userCreatedAt: number;
  attributes: Record<string, string>;
} & Starable;

export type NoteAttributesVO = Record<string, string[]>;

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

type NotePathNode = Pick<NoteVO, 'title' | 'icon' | 'id'>;
export type NotePath = Array<NotePathNode & { siblings: NotePathNode[] }>;

export function normalizeTitle(note?: NoteVO) {
  if (!note) {
    return '';
  }

  return note.title || `未命名笔记-${dayjs.unix(note.createdAt).format('YYYYMMDD-HHmm')}`;
}
