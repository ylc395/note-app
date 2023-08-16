import type { NoteBody, ClientNotesPatch, Note, NoteQuery, NotePatch, NewNote } from 'model/note';

export interface NoteRepository {
  create: (note: NewNote) => Promise<Note>;
  update: (noteId: Note['id'], note: NotePatch) => Promise<Note | null>;
  batchUpdate: (notes: ClientNotesPatch) => Promise<Note[]>;
  updateBody: (noteId: Note['id'], noteBody: NoteBody) => Promise<NoteBody | null>;
  findAll: (query?: NoteQuery) => Promise<Note[]>;
  findChildrenIds: (noteIds: Note['id'][]) => Promise<Record<Note['id'], Note['id'][]>>;
  findBody: (noteId: Note['id']) => Promise<NoteBody | null>;
  findDescendantIds: (noteIds: Note['id'][]) => Promise<Record<Note['id'], Note['id'][]>>;
  findAncestorIds: (noteId: Note['id']) => Promise<Note['id'][]>;
  findOneById: (id: Note['id']) => Promise<Note | null>;
  removeById: (noteId: Note['id'] | Note['id'][]) => Promise<void>;
}
