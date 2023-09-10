import type { Memo } from 'shard/model/memo';

export * from 'shard/model/memo';

export interface MemoQuery {
  createdAfter?: number;
  updatedAfter?: number;
  limit?: number;
  id?: Memo['id'][];
  isAvailable?: boolean;
  orderBy?: 'createdAt';
}

export type NewMemo = Partial<Memo>;

export type MemoPatch = Omit<NewMemo, 'id' | 'createdAt'>;
