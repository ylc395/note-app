import type { LinkVO } from './content.js';
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
export type ClientMemoQuery =
  | {
      limit?: number;
      parentId?: EntityParentId;
      before?: Memo['id'];
      beforeIncludes?: Memo['id'];
      after?: Memo['id'];
      afterIncludes?: Memo['id'];
      isPinned?: boolean;
    }
  | Duration;
