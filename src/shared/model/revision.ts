import type { EntityId, EntityLocator } from './entity';

export interface RevisionVO {
  id: EntityId;
  createdAt: number;
  diff: string;
}

export interface Revision {
  entityId: EntityLocator['id'];
  entityType: EntityLocator['type'];
  diff: string;
}
