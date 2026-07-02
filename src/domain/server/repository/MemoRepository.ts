import type { MemoVO, Memo, MemoPatchDTO, ClientMemoQuery, MemoCountQuery } from '#domain/server/model/memo.js';

export type MemoPatch = MemoPatchDTO & Partial<Pick<Memo, 'updatedAt'>>;

export interface MemoQuery extends ClientMemoQuery {
  id?: string | string[];
  isAvailableOnly?: boolean;
}

export interface MemoRepository {
  create: (memo: Required<Memo>) => Promise<Memo>;
  update: (id: MemoVO['id'], patch: MemoPatch) => Promise<Memo | null>;
  findOneById: (id: MemoVO['id'], config?: { isAvailableOnly?: boolean }) => Promise<Memo | null>;
  findAll: (q: MemoQuery) => Promise<Memo[]>;
  queryCount: (q?: MemoCountQuery) => Promise<number>;
}
