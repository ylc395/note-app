import type { Memo, MemoVO, MemoQuery, NewMemo, MemoPatch, MemoDatesVO } from '@domain/model/memo';

export interface MemoRepository {
  create: (memo: NewMemo) => Promise<Memo>;
  update: (id: MemoVO['id'], patch: MemoPatch) => Promise<Memo | null>;
  findParent: (id: MemoVO['id']) => Promise<Memo | null>;
  findDescendantIds: (ids: MemoVO['id'][]) => Promise<Record<MemoVO['id'], MemoVO['id'][]>>;
  findOneById: (id: MemoVO['id']) => Promise<Memo | null>;
  findAll: (q?: MemoQuery) => Promise<Memo[]>;
  removeById: (id: MemoVO['id']) => Promise<void>;
  queryAvailableDates: () => Promise<MemoDatesVO>;
}
