import type { Note, NotePatchDTO } from '@domain/shared/model/note.js';

export interface NoteQuery {
  parentId?: Note['id'][] | Note['parentId'];
  id?: Note['id'][];
  updatedAfter?: number;
  isAvailable?: boolean;
}

export interface NotePatch extends NotePatchDTO {
  updatedAt: number;
}

export * from '@domain/shared/model/note.js';
