import { boolean, object, string, union, type infer as ZodInfer } from 'zod';
import dayjs from 'dayjs';
import type { EntityId, EntityParentId, Path } from './entity.js';

export const notePatchDTOSchema = object({
  title: string().optional(),
  parentId: string().nullish(),
  icon: string().nullish(),
  isReadonly: boolean().optional(),
  body: string().optional(),
});

export const clientNoteQuerySchema = object({
  parentId: union([string().array(), string().nullable()]).optional(),
  to: string().optional(),
});

export const noteDTOSchema = notePatchDTOSchema;

export type NoteDTO = ZodInfer<typeof noteDTOSchema>;

export type NotePatchDTO = ZodInfer<typeof notePatchDTOSchema>;

export type ClientNoteQuery = ZodInfer<typeof clientNoteQuerySchema>;

export interface Note {
  title: string;
  id: EntityId;
  parentId: EntityParentId;
  icon: string | null;
  updatedAt: number;
  createdAt: number;
  isReadonly: boolean;
  body?: string;
}

export interface NoteVO extends Note {
  isStar: boolean;
  childrenCount: number;
  path?: Path;
}

export function normalizeTitle(note: Note | NoteVO) {
  return note.title || `未命名笔记-${dayjs(note.createdAt).format('YYYYMMDD-HHmm')}`;
}
