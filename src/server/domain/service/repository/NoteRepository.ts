import type { NoteBodyDTO, NoteDTO, NoteVO, NoteQuery } from 'interface/Note';

export const token = Symbol('NoteRepository');

export interface NoteRepository {
  create: (note: NoteDTO) => Promise<NoteVO>;
  update: (noteId: NoteVO['id'], note: NoteDTO) => Promise<NoteVO | null>;
  updateBody: (noteId: NoteVO['id'], noteBody: NoteBodyDTO) => Promise<NoteBodyDTO>;
  findAll: (query: NoteQuery) => Promise<NoteVO[]>;
  findBody: (noteId: NoteVO['id']) => Promise<NoteBodyDTO | null>;
  isAvailable: (noteId: NoteVO['id']) => Promise<boolean>;
  isWritable: (noteId: NoteVO['id']) => Promise<boolean>;
}
