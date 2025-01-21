import type { MemoVO, Memo, MemoPatchDTO } from '#domain/server/model/memo.js';
import type { EntityParentId } from '#domain/shared/model/entity.js';

export type MemoPatch = MemoPatchDTO & Partial<Pick<Memo, 'updatedAt'>>;

export interface MemoQuery {
  id?: string | string[];
  startTime?: number; // included
  startId?: string;
  endTime?: number; // included
  endId?: string;
  isAvailableOnly?: boolean;
  isPinned?: boolean;
  limit?: number;
  parentId?: EntityParentId;
  orderBy?: 'createdAt' | 'updatedAt';
  order?: 'desc' | 'asc'; // 默认 desc
}

export interface MemoRepository {
  create: (memo: Memo) => Promise<Memo>;
  update: (id: MemoVO['id'], patch: MemoPatch) => Promise<Memo | null>;
  findOneById: (id: MemoVO['id'], config?: { isAvailableOnly?: boolean }) => Promise<Memo | null>;
  findAll: (q: MemoQuery) => Promise<Memo[]>;
}
