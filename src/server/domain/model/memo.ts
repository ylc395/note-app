import type { EntityParentId } from 'model/entity';
import type { Memo } from 'shard/model/memo';

export * from 'shard/model/memo';

export interface MemoQuery {
  createdAfter?: number;
  createdBefore?: number;
  updatedAfter?: number;
  limit?: number;
  id?: Memo['id'][];
  isAvailable?: boolean;
  orderBy?: 'createdAt';
  parentId?: EntityParentId;
}

export type NewMemo = Partial<Memo>;

export type MemoPatch = Omit<NewMemo, 'id' | 'createdAt'>;
