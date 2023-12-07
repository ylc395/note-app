import type { EntityId, EntityParentId } from '../entity.js';

export interface Memo {
  id: EntityId;
  content: string;
  updatedAt: number;
  userUpdatedAt: number;
  createdAt: number;
  isPinned?: boolean;
  parentId: EntityParentId;
}
