import type { MemoVO, Memo, MemoQuery, MemoPatch } from '@domain/server/model/memo.js';

export interface MemoRepository {
  create: (memo: Memo) => Promise<Memo>;
  update: (id: MemoVO['id'], patch: MemoPatch) => Promise<Memo | null>;
  findOneById: (id: MemoVO['id'], config?: { isAvailableOnly?: boolean }) => Promise<Memo | null>;
  findAll: (q: MemoQuery) => Promise<Memo[]>;
  findLatest: () => Promise<Memo | null>;
}
