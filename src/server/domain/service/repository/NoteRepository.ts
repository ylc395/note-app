import type { NoteBodyDTO, NoteDTO, NoteVO, NotesDTO } from 'interface/Note';

export type NoteQuery = {
  parentId?: string | string[] | null;
  id?: string | string[];
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
  findAncestors: (noteId: NoteVO['id']) => Promise<NoteVO[]>;
}
