import dayjs from 'dayjs';
import type { NoteVO, NewNoteDTO, DuplicateNoteDTO, NotePatchDTO, Note, NoteBody } from 'shard/model/note';

export type NewNote = Partial<Note> & { body?: NoteBody; userUpdatedAt?: number };

export type NotePatch = Omit<NewNote, 'id'>;

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
