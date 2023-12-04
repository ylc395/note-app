import type { EntityId, EntityLocator } from './entity';

export interface RevisionVO {
  id: EntityId;
  createdAt: number;
  diff: string;
}

export interface Revision {
  entityId: EntityLocator['entityId'];
  entityType: EntityLocator['entityType'];
  diff: string;
}
