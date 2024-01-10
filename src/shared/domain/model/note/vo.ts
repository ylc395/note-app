import type { Note } from './base.js';
import type { Path } from '../entity.js';

export interface NoteVO extends Omit<Note, 'userUpdatedAt' | 'body'> {
  isStar: boolean;
  childrenCount: number;
  path?: Path;
}
