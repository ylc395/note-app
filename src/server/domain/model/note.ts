import dayjs from 'dayjs';
import type { NoteVO, NewNoteDTO, DuplicateNoteDTO, NotePatchDTO, Note, NoteBodyDTO } from 'shared/model/note';

export type NewNote = Partial<Note> & { body?: NoteBodyDTO };

export type NotePatch = Omit<NewNote, 'id' | 'createdAt'>;

export type NoteQuery = {
  parentId?: Note['parentId'];
  id?: Note['id'][];
  updatedAfter?: number;
  isAvailable?: boolean;
};

export function normalizeTitle(note: Pick<NoteVO, 'title' | 'createdAt'>) {
  return note.title || `未命名笔记-${dayjs(note.createdAt).format('YYYYMMDD-HHmm')}`;
}

export function isDuplicate(dto: NewNoteDTO): dto is DuplicateNoteDTO {
  return 'duplicateFrom' in dto;
}

export function isNewNote(dto: NewNoteDTO): dto is NotePatchDTO {
  return !isDuplicate(dto);
}

export * from 'shared/model/note';
