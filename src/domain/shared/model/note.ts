import dayjs from 'dayjs';
import type { Entity, EntityId, EntityParentId, Icon } from './entity.js';

export interface Note {
  id: EntityId;
  title: string;
  parentId: EntityParentId;
  body?: string;
  icon: Icon | null;
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

export type NewNoteDTO = Partial<Pick<Note, 'body' | 'fileId' | 'icon' | 'parentId' | 'sourceUrl' | 'title'>>;

/**
 * @api
 */
export type NoteDTO = DuplicatedNoteDTO | NewNoteDTO; // 这两个类型的顺序必须这样安排。NewNoteDTO 若在前，任何对象传过来都会满足，并被 strip 为一个 {} 对象

/**
 * @api
 */
export interface ClientNoteQuery {
  id?: Note['id'][];
  parentId?: EntityParentId | EntityParentId[];
  fileHash?: string;
  sourceUrl?: string;
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
