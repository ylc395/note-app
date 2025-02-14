import dayjs from 'dayjs';
import type { Entity, EntityId, EntityParentId } from './entity.js';

export interface Note {
  id: EntityId;
  title: string;
  parentId: EntityParentId;
  body?: string;
  bodyPlainText?: string;
  icon: string | null;
  fileId: string | null;
  sourceUrl: string | null;
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
export type NoteBatchPatchDTO = Pick<NotePatchDTO, 'parentId'>;

/**
 * @api
 */
export type NoteDTO =
  | Partial<Pick<Note, 'body' | 'fileId' | 'icon' | 'parentId' | 'sourceUrl' | 'title'>>
  | DuplicatedNoteDTO;

/**
 * @api
 */
export interface ClientNoteQuery {
  parentId?: EntityParentId | string[];
  fileHash?: string;
}

export interface NoteVO extends Omit<Note, 'body' | 'bodyPlainText'> {
  body?: string;
  isStar: boolean;
  childrenCount: number;
}

export function normalizeTitle(note: Note | NoteVO | Entity) {
  return note.title || `未命名笔记-${dayjs(note.createdAt).format('YYYYMMDD-HHmm')}`;
}
