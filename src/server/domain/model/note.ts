import dayjs from 'dayjs';
import type { ClientNote, ClientNewNote, DuplicateNote, ClientNotePatch, Note } from 'shard/model/note';

export type NotePatch = Partial<Omit<Note, 'id'>>;

export type NewNote = Partial<Note>;

export type NoteQuery = {
  parentId?: Note['parentId'];
  id?: Note['id'][];
  updatedAt?: number;
};

export function normalizeTitle(note: Pick<ClientNote, 'title' | 'createdAt'>) {
  return note.title || `未命名笔记-${dayjs.unix(note.createdAt).format('YYYYMMDD-HHmm')}`;
}

export function isDuplicate(dto: ClientNewNote): dto is DuplicateNote {
  return 'duplicateFrom' in dto;
}

export function isNewNote(dto: ClientNewNote): dto is ClientNotePatch {
  return !isDuplicate(dto);
}

export * from 'shard/model/note';
