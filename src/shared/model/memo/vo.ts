import type { Starable } from '../star';
import type { Memo } from './base';

export type MemoVO = Omit<Memo, 'userUpdatedAt'> & Starable;

export interface MemoDatesVO {
  [date: string]: number;
}