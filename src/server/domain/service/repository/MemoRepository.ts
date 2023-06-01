import type { MemoDTO, MemoPaginationQuery, ParentMemoVO, PaginationMemeVO, MemoVO } from 'interface/memo';

export type Memo = MemoDTO & Partial<Pick<MemoVO, 'createdAt' | 'updatedAt' | 'id'>>;

export interface MemoQuery {
  updatedAt: number;
}

export interface MemoRepository {
  create: (memo: Memo) => Promise<MemoVO>;
  update: (id: ParentMemoVO['id'], patch: Memo) => Promise<MemoVO | null>;
  list: (query: MemoPaginationQuery) => Promise<PaginationMemeVO>;
  findParent: (id: ParentMemoVO['id']) => Promise<ParentMemoVO | null>;
  findOneById: (id: MemoVO['id']) => Promise<MemoVO | null>;
  findAll: (q?: MemoQuery) => Promise<MemoVO[]>;
  removeById: (id: MemoVO['id']) => Promise<void>;
}
