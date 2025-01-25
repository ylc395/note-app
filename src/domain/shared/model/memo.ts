import type { EntityParentId } from './entity.js';

export interface Memo {
  id: string;
  parentId: EntityParentId;
  isPinned: boolean;
  body: string;
  updatedAt: number;
  createdAt: number;
}

/**
 * @api
 */
export interface MemoVO extends Memo {
  isStar: boolean;
  followupsCount: number;
  referrersCount: number;
}

/**
 * @api
 */
export interface MemoDTO {
  parentId?: EntityParentId;
  body: string;
  isPinned?: boolean;
}

/**
 * @api
 */
export type MemoPatchDTO = Partial<Pick<MemoDTO, 'body' | 'isPinned'>>;

/**
 * @api
 */
export interface Duration {
  startTime?: number;
  endTime?: number;
}

/**
 * @api
 */
export type ClientMemoQuery = {
  limit: number;
  orderBy: 'createdAt' | 'updatedAt';
  order: 'asc' | 'desc';
  parentId?: EntityParentId;
  isPinned?: boolean;
  startTime?: number;
  endTime?: number;
  endId?: Memo['id'];
  startId?: Memo['id'];
};
