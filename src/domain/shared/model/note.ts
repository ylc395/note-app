import dayjs from 'dayjs';
import type { Entity, EntityId, EntityParentId } from './entity.js';

export interface Note {
  title: string;
  id: EntityId;
  parentId: EntityParentId;
  body?: string;
  icon: string | null;
  updatedAt: number;
  createdAt: number;
}

/**
 * @api
 */
export type NotePatchDTO = Partial<Pick<Note, 'title' | 'parentId' | 'icon' | 'body'>>;

/**
 * @api
 */
export interface DuplicatedNoteDTO {
  from: Note['id'];
}

/**
 * @api
 */
export type NoteBatchPatchDTO = Pick<NotePatchDTO, 'icon' | 'parentId'>;

/**
 * @api
 */
export type NoteDTO = NotePatchDTO | DuplicatedNoteDTO;

/**
 * @api
 */
export interface ClientNoteQuery {
  parentId?: EntityParentId | string[];
}

export interface NoteVO extends Omit<Note, 'body'> {
  body?: string;
  isStar: boolean;
  childrenCount: number;
}

export function normalizeTitle(note: Note | NoteVO | Entity) {
  return note.title || `未命名笔记-${dayjs(note.createdAt).format('YYYYMMDD-HHmm')}`;
}
