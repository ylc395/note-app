import type { EntityLocator } from 'model/entity';
import type { Pos } from 'shard/model/content';

export * from 'shard/model/content';

export interface ContentUpdate extends EntityLocator {
  content: string;
}

interface LinkFrom extends EntityLocator {
  pos: Pos;
}

interface LinkTo extends EntityLocator {
  fragmentId: string;
}

export interface Link {
  from: LinkFrom;
  to: LinkTo;
  createdAt: number;
}

export interface Topic extends EntityLocator {
  name: string;
  pos: Pos;
  createdAt: number;
}
