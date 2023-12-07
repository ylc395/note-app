import type { Starable } from '../star.js';
import type { Memo } from './base.js';

export type MemoVO = Omit<Memo, 'userUpdatedAt'> & Starable;

export interface MemoDatesVO {
  [date: string]: number;
}
