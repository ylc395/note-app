import dayjs from 'dayjs';
import type { NoteVO, NoteDTO } from 'shard/model/note';

export type Note = Omit<NoteVO, 'childrenCount' | 'isStar'>;

export type NoteQuery = {
  parentId?: Note['parentId'];
  id?: Note['id'][];
  updatedAt?: number;
};

export type NotePatch = Omit<NoteDTO, 'duplicateFrom'> & Partial<Pick<Note, 'updatedAt' | 'createdAt' | 'id'>>;

export function normalizeTitle(note: Pick<NoteVO, 'title' | 'createdAt'>) {
  return note.title || `未命名笔记-${dayjs.unix(note.createdAt).format('YYYYMMDD-HHmm')}`;
}

export * from 'shard/model/note';
