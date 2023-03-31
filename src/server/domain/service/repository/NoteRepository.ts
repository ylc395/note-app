import type { NoteBodyDTO, NoteDTO, NoteVO, NotesDTO, NoteAttributesVO } from 'interface/note';

export type NoteQuery = {
  parentId?: NoteVO['parentId'] | NonNullable<NoteVO['id']>[];
  id?: NoteVO['id'] | NoteVO['id'][];
  isReadonly?: NoteVO['isReadonly'];
};

export interface NoteRepository {
  create: (note: NoteDTO) => Promise<NoteVO>;
  update: (noteId: NoteVO['id'], note: NoteDTO) => Promise<NoteVO | null>;
  batchUpdate: (notes: NotesDTO) => Promise<NoteVO[]>;
  updateBody: (noteId: NoteVO['id'], noteBody: NoteBodyDTO) => Promise<NoteBodyDTO | null>;
  findAll: (query: NoteQuery) => Promise<NoteVO[]>;
  findBody: (noteId: NoteVO['id']) => Promise<NoteBodyDTO | null>;
  areAvailable: (noteIds: NoteVO['id'][]) => Promise<boolean>;
  isWritable: (noteId: NoteVO['id']) => Promise<boolean>;
  findAllDescendantIds: (noteIds: NoteVO['id'][]) => Promise<NoteVO['id'][]>;
  findTreeFragment: (noteId: NoteVO['id']) => Promise<NoteVO[]>;
  findAttributes: () => Promise<NoteAttributesVO>;
}
