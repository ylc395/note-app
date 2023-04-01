import type { MemoDTO, MemoPatchDTO, MemoQuery, MemoVO, PaginationMemeVO } from 'interface/memo';

export interface MemoRepository {
  create: (memo: MemoDTO) => Promise<MemoVO>;
  update: (id: MemoVO['id'], patch: MemoPatchDTO) => Promise<MemoVO | null>;
  list: (query: MemoQuery) => Promise<PaginationMemeVO>;
  findParent: (id: MemoVO['id']) => Promise<MemoVO | null>;
}
