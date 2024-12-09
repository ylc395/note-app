import type { LinkVO } from './content.js';
import type { EntityParentId } from './entity.js';

export interface Memo {
  id: string;
  parentId: EntityParentId;
  isPinned: boolean;
  body: string;
  orderIndex: number;
  updatedAt: number;
  createdAt: number;
}

/**
 * @api
 */
export interface MemoVO extends Memo {
  isStar: boolean;
  childrenCount: number;
  referrers: LinkVO[];
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
  limit: number;
  order?: 'asc' | 'desc';
  parentId?: EntityParentId;
  isPinned?: boolean;
  startIndex?: Memo['orderIndex'];
  endIndex?: Memo['orderIndex'];
  startTime?: number;
  endTime?: number;
};
