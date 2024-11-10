import type { Note, NotePatchDTO } from '@domain/shared/model/note.js';

export interface NoteQuery {
  parentId?: Note['id'][] | Note['parentId'];
  id?: Note['id'][];
  isAvailableOnly?: boolean;
}

export type NotePatch = NotePatchDTO & Partial<Pick<Note, 'updatedAt'>>;

export interface NoteRepository {
  create: (note: Note) => Promise<Required<Note>>;
  update(noteId: Note['id'] | Note['id'][], patch: NotePatch): Promise<boolean>;
  findAll: (query: NoteQuery) => Promise<Note[]>;
  findOneById: (id: Note['id'], config?: { isAvailableOnly?: boolean }) => Promise<Required<Note> | null>;
}
