import type { NoteBodyDTO, NoteDTO, NotesDTO, NoteBodyVO } from 'interface/note';
import type { RawNoteVO } from 'model/note';

export type NoteQuery = {
  parentId?: RawNoteVO['parentId'];
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
  findAllChildren: (noteIds: RawNoteVO['id'][]) => Promise<RawNoteVO[]>;
  findBody: (noteId: RawNoteVO['id']) => Promise<NoteBodyVO | null>;
  findAllDescendantIds: (noteIds: RawNoteVO['id'][]) => Promise<Record<RawNoteVO['id'], RawNoteVO['id'][]>>;
  findTreeFragment: (noteId: RawNoteVO['id']) => Promise<RawNoteVO[]>; // including self
  findOneById: (id: RawNoteVO['id']) => Promise<RawNoteVO | null>;
  removeById: (noteId: RawNoteVO['id'] | RawNoteVO['id'][]) => Promise<void>;
}
