import type { MemoVO, Memo, MemoPatchDTO } from '#domain/server/model/memo.js';
import type { EntityParentId } from '#domain/shared/model/entity.js';

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

export interface MemoRepository {
  create: (memo: Memo) => Promise<Memo>;
  update: (id: MemoVO['id'], patch: MemoPatch) => Promise<Memo | null>;
  findOneById: (id: MemoVO['id'], config?: { isAvailableOnly?: boolean }) => Promise<Memo | null>;
  findAll: (q: MemoQuery) => Promise<Memo[]>;
  findLatest: () => Promise<Memo | null>;
}
