import type { EntityId, EntityLocator, EntityTypes } from 'model/entity';

export interface ContentUpdate {
  id: EntityId;
  type: EntityTypes;
  content: string;
}

interface LinkFrom extends EntityLocator {
  pos: `${number},${number}`;
}

interface LinkTo extends EntityLocator {
  fragmentId: string;
}

export interface Link {
  from: LinkFrom;
  to: LinkTo;
}
