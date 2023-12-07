import dayjs from 'dayjs';
import type { EntityParentId } from '@domain/model/entity.js';
import type { Memo } from '@shared/domain/model/memo/index.js';

export * from '@shared/domain/model/memo/index.js';

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

export function normalizeTitle(memo: Pick<Memo, 'createdAt'>) {
  return `${dayjs(memo.createdAt).format('YYYYMMDD-HHmm')}的 Memo`;
}
