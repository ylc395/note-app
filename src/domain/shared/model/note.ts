import dayjs from 'dayjs';
import type { ParsedDiff } from 'diff';
import type { Entity, EntityId, EntityParentId } from './entity.js';

/**
 * @api
 */
export interface NotePatchDTO {
  title?: string;
  parentId?: EntityParentId;
  icon?: string | null;
  body?: string;
}

/**
 * @api
 */
export interface ClientNoteQuery {
  parentId?: string[] | string | null;
}

/**
 * @api
 */
export type NoteDTO = NotePatchDTO;

export interface Note {
  title: string;
  id: EntityId;
  parentId: EntityParentId;
  icon: string | null;
  updatedAt: number;
  createdAt: number;
  body?: string;
}

/**
 * @api
 */
export interface NoteVO extends Note {
  isStar: boolean;
  childrenCount: number;
  diff?: ParsedDiff;
}

export function normalizeTitle(note: Note | NoteVO | Entity) {
  return note.title || `未命名笔记-${dayjs(note.createdAt).format('YYYYMMDD-HHmm')}`;
}
