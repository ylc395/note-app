import type { EntityId, EntityParentId } from '../entity.js';

export interface Note {
  title: string;
  isReadonly: boolean;
  id: EntityId;
  parentId: EntityParentId;
  icon: string | null;
  updatedAt: number;
  userUpdatedAt: number;
  createdAt: number;
  body: string;
}
