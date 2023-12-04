import type { Note } from './base';
import type { Starable } from '../star';
import type { Path } from '../entity';

export interface NoteVO extends Starable, Omit<Note, 'userUpdatedAt'> {
  childrenCount: number;
}

export interface DetailedNoteVO extends Omit<Note, 'userUpdatedAt'> {
  body: string;
  path: Path;
}
