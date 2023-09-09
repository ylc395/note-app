import type { EntityId } from '../entity';

export interface Memo {
  id: EntityId;
  content: string;
  updatedAt: number;
  userUpdatedAt: number;
  createdAt: number;
  isPinned?: boolean;
}
