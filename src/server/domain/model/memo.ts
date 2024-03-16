import type { Entity, EntityParentId } from '@domain/model/entity.js';

export * from '@shared/domain/model/memo.js';

export function normalizeTitle(memo: Entity) {
  return `memo-${memo.createdAt}`;
}

export interface MemoQuery {
  id?: string | string[];
  startTime?: number;
  endTime?: number;
  isAvailable?: boolean;
  isPinned?: boolean;
  limit?: number;
  parentId?: EntityParentId;
  orderBy?: 'createdAt';
}
