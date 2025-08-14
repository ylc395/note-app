export * from '#domain/shared/model/note';

import type { Note, ClientNoteQuery, NotePatchDTO } from '#domain/shared/model/note';

export interface NoteQuery {
  parentId?: Note['id'][] | Note['parentId'];
  id?: Note['id'][];
  fileHash?: ClientNoteQuery['fileHash'];
  isAvailableOnly?: boolean;
}

export type NewNote = Required<Omit<Note, 'mimeType'>>;

export type NotePatch = NotePatchDTO & Partial<Pick<Note, 'updatedAt'>>;
