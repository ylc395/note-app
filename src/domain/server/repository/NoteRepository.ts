import type { Note, NotePatchDTO, ClientNoteQuery } from '#domain/shared/model/note.js';
import type { FileVO } from '../model/file';

export interface NoteQuery {
  parentId?: Note['id'][] | Note['parentId'];
  id?: Note['id'][];
  type?: ClientNoteQuery['type'];
  fileHash?: ClientNoteQuery['fileHash'];
  isAvailableOnly?: boolean;
}

export type NotePatch = NotePatchDTO & Partial<Pick<Note, 'updatedAt' | 'bodyPlainText'>>;

export interface NoteRepository {
  create: (note: Required<Note>) => Promise<Required<Note>>;
  update(noteId: Note['id'] | Note['id'][], patch: NotePatch): Promise<boolean>;
  findAll: (query: NoteQuery) => Promise<Note[]>;
  findOneById: (id: Note['id'], config?: { isAvailableOnly?: boolean }) => Promise<Required<Note> | null>;
  findBlobById: (id: Note['id'], config?: { isAvailableOnly?: boolean }) => Promise<ArrayBuffer | null>;
  findFiles: (ids: Note['id'][]) => Promise<Record<Note['id'], FileVO>>;
}
