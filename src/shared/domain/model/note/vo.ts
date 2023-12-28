import type { Note } from './base.js';
import type { Starable } from '../star.js';
import type { Path } from '../entity.js';

export interface NoteVO extends Starable, Omit<Note, 'userUpdatedAt' | 'body'> {
  childrenCount: number;
  path: Path;
}
