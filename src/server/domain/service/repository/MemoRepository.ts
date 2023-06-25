import type {
  MemoDTO,
  MemoPaginationQuery,
  ParentMemoVO,
  PaginationMemeVO,
  MemoVO,
  MemoPatchDTO,
} from 'interface/memo';

export interface MemoQuery {
  updatedAt: number;
}

export interface MemoRepository {
  create: (memo: MemoDTO) => Promise<MemoVO>;
  update: (
    id: ParentMemoVO['id'],
    patch: MemoPatchDTO & Partial<Pick<MemoVO, 'createdAt' | 'updatedAt'>>,
  ) => Promise<MemoVO | null>;
  list: (query: MemoPaginationQuery) => Promise<PaginationMemeVO>;
  findParent: (id: ParentMemoVO['id']) => Promise<ParentMemoVO | null>;
  findOneById: (id: MemoVO['id']) => Promise<MemoVO | null>;
  findAll: (q?: MemoQuery) => Promise<MemoVO[]>;
  removeById: (id: MemoVO['id']) => Promise<void>;
}
