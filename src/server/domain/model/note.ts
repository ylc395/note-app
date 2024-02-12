import type { Note, NotePatchDTO } from '@shared/domain/model/note.js';

export interface NoteQuery {
  parentId?: Note['parentId'];
  id?: Note['id'][];
  updatedAfter?: number;
  isAvailable?: boolean;
}

export interface NotePatch extends NotePatchDTO {
  updatedAt: number;
}

export * from '@shared/domain/model/note.js';
