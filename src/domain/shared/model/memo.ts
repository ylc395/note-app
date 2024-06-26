import type { EntityParentId } from './entity.js';

export interface Memo {
  id: string;
  parentId: EntityParentId;
  isPinned: boolean;
  sourceUrl: string | null;
  body: string;
  updatedAt: number;
  createdAt: number;
}

/**
 * @api
 */
export interface MemoVO extends Memo {
  isStar: boolean;
  childrenCount: number;
  referrersCount: number;
}

/**
 * @api
 */
export interface MemoDTO {
  parentId: EntityParentId;
  body: string;
  isPinned?: boolean;
  sourceUrl?: string;
}

/**
 * @api
 */
export type MemoPatchDTO = Partial<Pick<MemoDTO, 'body' | 'isPinned' | 'sourceUrl'>>;

export interface Duration {
  startTime: number;
  endTime: number;
}

/**
 * @api
 */
export interface ClientMemoQuery extends Partial<Duration> {
  limit?: number;
  parentId?: EntityParentId;
  before?: Memo['id'];
  after?: Memo['id'];
  isPinned?: boolean;
}

/**
 * @api
 */
export interface ClientTreeFragmentQuery {
  limit: number;
  to: Memo['id'];
}

export interface DateInfo {
  date: string;
  count: number;
}
