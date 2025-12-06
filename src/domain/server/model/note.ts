export * from '#domain/shared/model/note';

import type { Note, ClientNoteQuery, NotePatchDTO } from '#domain/shared/model/note';
import type { MaybeArray } from '#utils/collection';

export interface NoteQuery {
  parentId?: MaybeArray<Note['parentId']>;
  id?: Note['id'][];
  fileHash?: ClientNoteQuery['fileHash'];
  sourceUrl?: ClientNoteQuery['sourceUrl'];
  isAvailableOnly?: boolean;
}

export type NewNote = Required<Omit<Note, 'mimeType'>>;

export type NotePatch = NotePatchDTO & Partial<Pick<Note, 'updatedAt' | 'fileId' | 'sourceUrl'>>;
