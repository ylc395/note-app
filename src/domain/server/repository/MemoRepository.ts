import type {
  MemoVO,
  Memo,
  MemoPatchDTO,
  ClientMemoQuery,
  CountQuery as ClientCountQuery,
} from '#domain/server/model/memo.js';
import type { EntityParentId } from '#domain/shared/model/entity.js';

export type MemoPatch = MemoPatchDTO & Partial<Pick<Memo, 'updatedAt'>>;

export interface MemoQuery extends ClientMemoQuery {
  id?: string | string[];
  isAvailableOnly?: boolean;
}

export interface CountQuery extends ClientCountQuery {
  parentId?: EntityParentId;
}

export interface MemoRepository {
  create: (memo: Memo) => Promise<Memo>;
  update: (id: MemoVO['id'], patch: MemoPatch) => Promise<Memo | null>;
  findOneById: (id: MemoVO['id'], config?: { isAvailableOnly?: boolean }) => Promise<Memo | null>;
  findAll: (q: MemoQuery) => Promise<Memo[]>;
  queryCount: (q?: CountQuery) => Promise<number>;
}
