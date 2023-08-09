import type { NoteBodyDTO, NotesDTO, NoteBodyVO, Note, RawNote, NoteQuery } from 'model/note';

export interface NoteRepository {
  create: (note: RawNote) => Promise<Note>;
  update: (noteId: Note['id'], note: RawNote) => Promise<Note | null>;
  batchUpdate: (notes: NotesDTO) => Promise<Note[]>;
  updateBody: (noteId: Note['id'], noteBody: NoteBodyDTO['content']) => Promise<NoteBodyVO | null>;
  findAll: (query?: NoteQuery) => Promise<Note[]>;
  findAllChildren: (noteIds: Note['id'][]) => Promise<Note[]>;
  findBody: (noteId: Note['id']) => Promise<NoteBodyVO | null>;
  findAllDescendantIds: (noteIds: Note['id'][]) => Promise<Record<Note['id'], Note['id'][]>>;
  findTreeFragment: (noteId: Note['id']) => Promise<Note[]>; // including self
  findOneById: (id: Note['id']) => Promise<Note | null>;
  removeById: (noteId: Note['id'] | Note['id'][]) => Promise<void>;
}
