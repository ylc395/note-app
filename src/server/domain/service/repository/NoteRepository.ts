import type { Note, NoteDTO, NotePatch, NoteQuery } from '@domain/model/note.js';

export interface NoteRepository {
  create: (note: NoteDTO) => Promise<Required<Note>>;
  update(noteId: Note['id'] | Note['id'][], patch: NotePatch): Promise<boolean>;
  findAll: (query: NoteQuery) => Promise<Note[]>;
  findOneById: (id: Note['id']) => Promise<Required<Note> | null>;
}
