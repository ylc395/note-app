import type { Note, NotePatch, NewNote } from '@domain/model/note';

export interface NoteQuery {
  parentId?: Note['parentId'];
  id?: Note['id'][];
  updatedAfter?: number;
  isAvailable?: boolean;
}

export interface NoteRepository {
  create: (note?: NewNote) => Promise<Required<Note>>;
  update(noteId: Note['id'] | Note['id'][], patch: NotePatch): Promise<boolean>;
  findAll: (query?: NoteQuery) => Promise<Note[]>;
  findChildrenIds: (noteIds: Note['id'][], availableOnly?: boolean) => Promise<Record<Note['id'], Note['id'][]>>;
  findDescendantIds: (noteIds: Note['id'][]) => Promise<Record<Note['id'], Note['id'][]>>;
  findAncestorIds(noteId: Note['id'][]): Promise<Record<Note['id'], Note['id'][]>>;
  findOneById: (id: Note['id'], availableOnly?: boolean) => Promise<Required<Note> | null>;
  removeById: (noteId: Note['id'] | Note['id'][]) => Promise<boolean>;
}
