import type { EntityLocator } from '../entity.js';

interface TopicEntity extends EntityLocator {
  title: string;
}

export interface TopicVO {
  name: string;
  activeAt: number;
  entities: TopicEntity[];
}
