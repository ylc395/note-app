import type { MemoDTO, MemoPatchDTO, MemoQuery, MemoVO, PaginationMemeVO } from 'interface/Memo';

export interface MemoRepository {
  create: (memo: MemoDTO) => Promise<MemoVO>;
  update: (id: MemoVO['id'], patch: MemoPatchDTO) => Promise<MemoVO | null>;
  findAll: (query: MemoQuery) => Promise<PaginationMemeVO>;
}
