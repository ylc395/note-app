import type { Referrer } from './content.js';
import type { EntityParentId } from './entity.js';

export interface Memo {
  id: string;
  parentId: EntityParentId;
  isPinned: boolean;
  body: string;
  index: number;
  updatedAt: number;
  createdAt: number;
}

/**
 * @api
 */
export interface MemoVO extends Memo {
  isStar: boolean;
  childrenCount: number;
  referrers: Referrer[];
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
  startTime: number;
  endTime: number;
}

/**
 * @api
 */
export type ClientMemoQuery = {
  limit?: number;
  order?: 'asc' | 'desc';
  parentId?: EntityParentId;
  isPinned?: boolean;
  startIndex?: Memo['index'];
  endIndex?: Memo['index'];
  startTime?: number;
  endTime?: number;
};
