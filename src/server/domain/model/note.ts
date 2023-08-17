import dayjs from 'dayjs';
import type { NoteVO, NewNoteDTO, DuplicateNoteDTO, NotePatchDTO, Note } from 'shard/model/note';

export type NotePatch = Partial<Omit<Note, 'id'>>;

export type NewNote = Partial<Note>;

export type NoteQuery = {
  parentId?: Note['parentId'];
  id?: Note['id'][];
  updatedAt?: number;
};

export function normalizeTitle(note: Pick<NoteVO, 'title' | 'createdAt'>) {
  return note.title || `未命名笔记-${dayjs.unix(note.createdAt).format('YYYYMMDD-HHmm')}`;
}

export function isDuplicate(dto: NewNoteDTO): dto is DuplicateNoteDTO {
  return 'duplicateFrom' in dto;
}

export function isNewNote(dto: NewNoteDTO): dto is NotePatchDTO {
  return !isDuplicate(dto);
}

export * from 'shard/model/note';
