import dayjs from 'dayjs';
import type { Entity, EntityId, EntityParentId } from './entity.js';

export interface Note {
  id: EntityId;
  title: string;
  parentId: EntityParentId;
  body?: string;
  icon: string | null;
  fileId: string | null;
  mimeType: string | null;
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

export type NewNoteDTO = Partial<Pick<Note, 'body' | 'fileId' | 'icon' | 'parentId' | 'sourceUrl' | 'title'>>;

/**
 * @api
 */
export type NoteDTO = NewNoteDTO | DuplicatedNoteDTO;

/**
 * @api
 */
export interface ClientNoteQuery {
  id?: Note['id'][];
  parentId?: EntityParentId | string[];
  fileHash?: string;
}

export interface NoteVO extends Omit<Note, 'fileId'> {
  isStar: boolean;
  childrenCount: number;
}

/**
 * @api
 */
export interface FileTextQuery {
  id: Note['id'];
  pages?: number[];
}

export function normalizeTitle(note: Note | NoteVO | Entity) {
  return note.title || `未命名笔记-${dayjs(note.createdAt).format('YYYYMMDD-HHmm')}`;
}
