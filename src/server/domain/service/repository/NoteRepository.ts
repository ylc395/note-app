import type { NoteBodyDTO, NoteDTO, NoteVO, NoteQuery as NoteClientQuery } from 'interface/Note';

export const token = Symbol('NoteRepository');

export type NoteQuery = Omit<NoteClientQuery, 'parentId'> & {
  parentId?: string | string[] | null;
};

export interface NoteRepository {
  create: (note: NoteDTO) => Promise<NoteVO>;
  update: (noteId: NoteVO['id'], note: NoteDTO) => Promise<NoteVO | null>;
  updateBody: (noteId: NoteVO['id'], noteBody: NoteBodyDTO) => Promise<NoteBodyDTO>;
  findAll: (query: NoteQuery) => Promise<NoteVO[]>;
  findBody: (noteId: NoteVO['id']) => Promise<NoteBodyDTO | null>;
  isAvailable: (noteId: NoteVO['id'] | NoteVO['id'][]) => Promise<boolean>;
  isWritable: (noteId: NoteVO['id']) => Promise<boolean>;
}
