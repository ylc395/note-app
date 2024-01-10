import type { Memo } from './base.js';

export type MemoVO = Omit<Memo, 'userUpdatedAt'> & { isStar: boolean };

export interface MemoDatesVO {
  [date: string]: number;
}
