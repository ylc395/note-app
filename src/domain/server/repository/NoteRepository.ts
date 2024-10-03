import type { Note, NotePatch, NoteQuery } from '@domain/server/model/note.js';

export interface NoteRepository {
  create: (note: Note) => Promise<Note>;
  update(noteId: Note['id'] | Note['id'][], patch: NotePatch): Promise<boolean>;
  findAll: (query: NoteQuery) => Promise<Note[]>;
  findOneById: (id: Note['id'], config?: { isAvailableOnly?: boolean }) => Promise<Required<Note> | null>;
}
