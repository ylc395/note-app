import type { Note } from '@shared/domain/model/note.js';

export type NewNote = Omit<Partial<Note>, 'id'>;

export interface NoteQuery {
  parentId?: Note['parentId'];
  id?: Note['id'][];
  updatedAfter?: number;
  isAvailable?: boolean;
}

export type NotePatch = Omit<NewNote, 'createdAt'>;

export * from '@shared/domain/model/note.js';
