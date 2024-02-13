import type { Note, NoteDTO, NotePatch, NoteQuery } from '@domain/model/note.js';

export interface NoteRepository {
  create: (note: NoteDTO) => Promise<Required<Note>>;
  update(noteId: Note['id'] | Note['id'][], patch: NotePatch): Promise<boolean>;
  findAll: (query: NoteQuery) => Promise<Note[]>;
  findChildrenIds: (
    noteIds: Note['id'][],
    options?: { isAvailableOnly?: boolean },
  ) => Promise<Record<Note['id'], Note['id'][]>>;
  findDescendantIds: (noteIds: Note['id'][]) => Promise<Record<Note['id'], Note['id'][]>>;
  findAncestorIds(noteId: Note['id'][]): Promise<Record<Note['id'], Note['id'][]>>;
  findOneById: (id: Note['id']) => Promise<Required<Note> | null>;
}
