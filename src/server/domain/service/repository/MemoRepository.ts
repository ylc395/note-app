import type { MemoDTO, ParentMemoVO, MemoVO, MemoPatchDTO, MemoQuery } from 'model/memo';

export interface MemoRepository {
  create: (memo: MemoDTO) => Promise<MemoVO>;
  update: (
    id: ParentMemoVO['id'],
    patch: MemoPatchDTO & Partial<Pick<MemoVO, 'createdAt' | 'updatedAt'>>,
  ) => Promise<MemoVO | null>;
  findParent: (id: ParentMemoVO['id']) => Promise<ParentMemoVO | null>;
  findDescendantIds: (ids: MemoVO['id'][]) => Promise<Record<MemoVO['id'], MemoVO['id'][]>>;
  findOneById: (id: MemoVO['id']) => Promise<MemoVO | null>;
  findAll: (q?: MemoQuery) => Promise<MemoVO[]>;
  removeById: (id: MemoVO['id']) => Promise<void>;
}
