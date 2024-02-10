import type { Memo, MemoVO, MemoQuery, MemoDTO, MemoPatchDTO, DateInfo, Duration } from '@domain/model/memo.js';

export interface MemoRepository {
  create: (memo: MemoDTO) => Promise<Memo>;
  update: (id: MemoVO['id'], patch: MemoPatchDTO) => Promise<Memo | null>;
  findOneById: (id: MemoVO['id']) => Promise<Memo | null>;
  findAll: (q: MemoQuery) => Promise<Memo[]>;
  queryAvailableDates: (duration: Duration) => Promise<DateInfo[]>;
}
