import type { EntityLocator } from 'model/entity';

type Pos = `${number},${number}`;

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
}

export interface Topic extends EntityLocator {
  name: string;
  pos: Pos;
}
