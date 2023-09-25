import type { EntityLocator } from 'model/entity';
import type { HighlightPosition } from 'shard/model/content';

export * from 'shard/model/content';

export interface ContentUpdate extends EntityLocator {
  content: string;
}

interface LinkFrom extends EntityLocator {
  position: HighlightPosition;
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
  position: HighlightPosition;
  createdAt: number;
}

export type TopicDTO = Omit<Topic, 'createdAt'>;
