import dayjs from 'dayjs';
import type { NoteVO, Note } from 'shared/model/note';

export type NewNote = Partial<Note>;

export type NotePatch = Omit<NewNote, 'id' | 'createdAt'>;

export function normalizeTitle(note: Pick<NoteVO, 'title' | 'createdAt'>) {
  return note.title || `未命名笔记-${dayjs(note.createdAt).format('YYYYMMDD-HHmm')}`;
}

export * from 'shared/model/note';
