import type { MemoDTO, MemoPatchDTO, MemoQuery, ParentMemoVO, PaginationMemeVO, MemoVO } from 'interface/memo';

export interface MemoRepository {
  create: (memo: MemoDTO) => Promise<MemoVO>;
  update: (id: ParentMemoVO['id'], patch: MemoPatchDTO) => Promise<MemoVO | null>;
  list: (query: MemoQuery) => Promise<PaginationMemeVO>;
  findParent: (id: ParentMemoVO['id']) => Promise<ParentMemoVO | null>;
}
