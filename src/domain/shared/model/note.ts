import dayjs from 'dayjs';
import type { Entity, EntityId, EntityParentId } from './entity.js';

export enum NoteTypes {
  Note = 1,
  Material,
}

export interface Note {
  id: EntityId;
  type?: NoteTypes;
  title: string;
  parentId: EntityParentId;
  body?: string;
  bodyPlainText?: string;
  icon: string | null;
  fileId: string | null; // material 有可能存在该属性
  sourceUrl: string | null; // material 有可能存在该属性
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

export type NewNoteDTO = Partial<Pick<Note, 'body' | 'fileId' | 'icon' | 'parentId' | 'sourceUrl' | 'title'>> &
  Required<Pick<Note, 'type'>>;

/**
 * @api
 */
export type NoteDTO = NewNoteDTO | DuplicatedNoteDTO;

/**
 * @api
 */
export interface ClientNoteQuery {
  type?: Note['type'];
  parentId?: EntityParentId | string[];
  fileHash?: string;
}

export interface NoteVO extends Omit<Note, 'bodyPlainText' | 'type'> {
  isStar: boolean;
  childrenCount: number;
}

export function normalizeTitle(note: Note | NoteVO | Entity) {
  return note.title || `未命名笔记-${dayjs(note.createdAt).format('YYYYMMDD-HHmm')}`;
}
