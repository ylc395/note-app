import type { NoteBodyDTO, NotesDTO, NoteBodyVO, Note, NotePatch, NoteQuery } from 'model/note';

export interface NoteRepository {
  create: (note: NotePatch) => Promise<Note>;
  update: (noteId: Note['id'], note: NotePatch) => Promise<Note | null>;
  batchUpdate: (notes: NotesDTO) => Promise<Note[]>;
  updateBody: (noteId: Note['id'], noteBody: NoteBodyDTO['content']) => Promise<NoteBodyVO | null>;
  findAll: (query?: NoteQuery) => Promise<Note[]>;
  findChildrenIds: (noteIds: Note['id'][]) => Promise<Record<Note['id'], Note['id'][]>>;
  findBody: (noteId: Note['id']) => Promise<NoteBodyVO | null>;
  findDescendantIds: (noteIds: Note['id'][]) => Promise<Record<Note['id'], Note['id'][]>>;
  findAncestorIds: (noteId: Note['id']) => Promise<Note['id'][]>;
  findOneById: (id: Note['id']) => Promise<Note | null>;
  removeById: (noteId: Note['id'] | Note['id'][]) => Promise<void>;
}
