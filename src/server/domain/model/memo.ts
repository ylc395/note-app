import { EntityParentId } from '@domain/model/entity.js';

export * from '@shared/domain/model/memo.js';

export interface MemoQuery {
  id?: string | string[];
  startTime?: number;
  endTime?: number;
  isAvailable?: boolean;
  limit?: number;
  parentId?: EntityParentId;
  orderBy?: 'createdAt';
}
