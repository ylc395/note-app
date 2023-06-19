import type { NoteBodyDTO, NoteDTO, RawNoteVO, NotesDTO, NoteAttributesVO, NoteBodyVO } from 'interface/note';

export type NoteQuery = {
  parentId?: RawNoteVO['parentId'] | RawNoteVO['id'][];
  id?: RawNoteVO['id'][];
  updatedAt?: number;
};

export type InternalNoteDTO = NoteDTO & Partial<Pick<RawNoteVO, 'updatedAt' | 'createdAt' | 'id'>>;

export interface NoteRepository {
  create: (note: InternalNoteDTO) => Promise<RawNoteVO>;
  update: (noteId: RawNoteVO['id'], note: InternalNoteDTO) => Promise<RawNoteVO | null>;
  batchUpdate: (notes: NotesDTO) => Promise<RawNoteVO[]>;
  updateBody: (noteId: RawNoteVO['id'], noteBody: NoteBodyDTO['content']) => Promise<NoteBodyVO | null>;
  findAll: (query?: NoteQuery) => Promise<RawNoteVO[]>;
  findBody: (noteId: RawNoteVO['id']) => Promise<NoteBodyVO | null>;
  findAllDescendantIds: (noteIds: RawNoteVO['id'][]) => Promise<RawNoteVO['id'][]>;
  findTreeFragment: (noteId: RawNoteVO['id']) => Promise<RawNoteVO[]>;
  findAttributes: () => Promise<NoteAttributesVO>;
  findOneById: (id: RawNoteVO['id']) => Promise<RawNoteVO | null>;
  removeById: (noteId: RawNoteVO['id'] | RawNoteVO['id'][]) => Promise<void>;
}
