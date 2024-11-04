import type { Entity, EntityParentId } from './entity.js';
import type { MemoPatchDTO, Memo } from '@domain/shared/model/memo.js';

export * from '@domain/shared/model/memo.js';

export type MemoPatch = MemoPatchDTO & Partial<Pick<Memo, 'updatedAt'>>;

export interface MemoQuery {
  id?: string | string[];
  startTime?: number; // included
  endTime?: number; // not included
  startIndex?: number; // included
  endIndex?: number; // not included
  isAvailableOnly?: boolean;
  isPinned?: boolean;
  limit?: number;
  parentId?: EntityParentId;
  orderBy?: {
    by: 'index';
    order: 'desc' | 'asc';
  };
}

export function normalizeTitle(memo: Entity) {
  return `memo-${memo.createdAt}`;
}
