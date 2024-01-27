import { boolean, object, string, type infer as ZodInfer } from 'zod';
import dayjs from 'dayjs';
import type { EntityId, EntityParentId, Path } from './entity.js';

export const notePatchDTOSchema = object({
  title: string().optional(),
  isReadonly: boolean().optional(),
  parentId: string().nullish(),
  icon: string().nullish(),
});

export const clientNoteQuerySchema = object({
  parentId: string().nullable().optional(),
  to: string().optional(),
});

export const newNoteDTOSchema = notePatchDTOSchema;

export type NewNoteDTO = ZodInfer<typeof newNoteDTOSchema>;

export type NotePatchDTO = ZodInfer<typeof notePatchDTOSchema>;

export type ClientNoteQuery = ZodInfer<typeof clientNoteQuerySchema>;

export interface Note {
  title: string;
  isReadonly: boolean;
  id: EntityId;
  parentId: EntityParentId;
  icon: string | null;
  updatedAt: number;
  userUpdatedAt: number;
  createdAt: number;
  body?: string;
}

export interface NoteVO extends Omit<Note, 'userUpdatedAt' | 'body'> {
  isStar: boolean;
  childrenCount: number;
  path?: Path;
}

export function normalizeTitle(note: Note | NoteVO) {
  return note.title || `未命名笔记-${dayjs(note.createdAt).format('YYYYMMDD-HHmm')}`;
}
