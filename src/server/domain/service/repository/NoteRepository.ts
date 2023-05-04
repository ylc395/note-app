import type { NoteBodyDTO, NoteDTO, NoteVO, NotesDTO, NoteAttributesVO, NoteBodyVO } from 'interface/note';

export type NoteQuery = {
  parentId?: NoteVO['parentId'] | NoteVO['id'][];
  id?: NoteVO['id'][];
  updatedAt?: number;
};

export type Note = NoteDTO & Partial<Pick<NoteVO, 'updatedAt' | 'createdAt' | 'id'>>;

export interface NoteRepository {
  create: (note: Note) => Promise<NoteVO>;
  update: (noteId: NoteVO['id'], note: Note) => Promise<NoteVO | null>;
  batchUpdate: (notes: NotesDTO) => Promise<NoteVO[]>;
  updateBody: (noteId: NoteVO['id'], noteBody: NoteBodyDTO['content']) => Promise<NoteBodyVO | null>;
  findAll: (query?: NoteQuery) => Promise<NoteVO[]>;
  findBody: (noteId: NoteVO['id']) => Promise<NoteBodyVO | null>;
  findAllDescendantIds: (noteIds: NoteVO['id'][]) => Promise<NoteVO['id'][]>;
  findTreeFragment: (noteId: NoteVO['id']) => Promise<NoteVO[]>;
  findAttributes: () => Promise<NoteAttributesVO>;
  findOneById: (id: NoteVO['id']) => Promise<NoteVO | null>;
  removeById: (noteId: NoteVO['id'] | NoteVO['id'][]) => Promise<void>;
}
