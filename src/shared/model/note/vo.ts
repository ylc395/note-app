import type { Note } from './base';
import type { Starable } from '../star';

export interface NoteVO extends Starable, Omit<Note, 'userUpdatedAt'> {
  childrenCount: number;
}

export type NoteBodyVO = string;
