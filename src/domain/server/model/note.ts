import type { Note, NotePatchDTO } from '@domain/shared/model/note.js';

export interface NoteQuery {
  parentId?: Note['id'][] | Note['parentId'];
  id?: Note['id'][];
  isAvailableOnly?: boolean;
}

export type NotePatch = NotePatchDTO & Partial<Pick<Note, 'updatedAt'>>;

export * from '@domain/shared/model/note.js';
