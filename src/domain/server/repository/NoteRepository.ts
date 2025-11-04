import type { Note, NewNote, NoteQuery, NotePatch } from '#domain/server/model/note.js';
import type { Icon } from '#domain/shared/model/entity';
import type { FileVO, TextLocation } from '../model/file';

export interface NoteRepository {
  create: (note: NewNote) => Promise<NewNote>;
  update(noteId: Note['id'] | Note['id'][], patch: NotePatch): Promise<boolean>;
  findAll: (query: NoteQuery) => Promise<Note[]>;
  findOneById: (id: Note['id'], config?: { isAvailableOnly?: boolean }) => Promise<Required<Note> | null>;
  findBlobById: (id: Note['id'], config?: { isAvailableOnly?: boolean }) => Promise<ArrayBuffer | null>;
  findFiles: (ids: Note['id'][]) => Promise<Record<Note['id'], FileVO>>;
  findFileTextLocation: (id: Note['id'], q: { pages?: number[] }) => Promise<TextLocation[]>;
  findAllCustomIcons: () => Promise<Icon[]>;
}
