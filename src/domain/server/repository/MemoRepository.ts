import type { MemoVO, Memo, MemoQuery, Duration, MemoPatch } from '@domain/server/model/memo.js';

export interface MemoRepository {
  create: (memo: Memo) => Promise<Memo>;
  update: (id: MemoVO['id'], patch: MemoPatch) => Promise<Memo | null>;
  findOneById: (id: MemoVO['id'], config?: { isAvailableOnly?: boolean }) => Promise<Memo | null>;
  findLatest: () => Promise<Memo | null>;
  findAll: (q: MemoQuery) => Promise<Memo[]>;
  findAvailableBetween: (q: Duration) => Promise<Pick<Memo, 'createdAt'>[]>;
}
