import type { Entity, EntityParentId } from '@domain/shared/model/entity.js';
import type { MemoPatchDTO, Duration, ClientMemoQuery, Memo } from '@domain/shared/model/memo.js';

export * from '@domain/shared/model/memo.js';

export type MemoPatch = MemoPatchDTO & Partial<Pick<Memo, 'updatedAt'>>;

export interface MemoQuery {
  id?: string | string[];
  startTime?: number;
  endTime?: number;
  isAvailableOnly?: boolean;
  isPinned?: boolean;
  limit?: number;
  parentId?: EntityParentId;
  order?: 'desc' | 'asc';
  orderBy?: 'index';
}

export function isDuration(q: ClientMemoQuery): q is Duration {
  return 'startTime' in q && 'endTime' in q;
}

export function normalizeTitle(memo: Entity) {
  return `memo-${memo.createdAt}`;
}
