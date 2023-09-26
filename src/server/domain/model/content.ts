import type { EntityLocator } from 'model/entity';
import type { TopicDTO, LinkDTO } from 'shard/model/content';

export * from 'shard/model/content';

export interface ContentUpdate extends EntityLocator {
  content: string;
  updatedAt?: number;
}

export interface Link extends LinkDTO {
  createdAt: number;
}

export interface Topic extends TopicDTO {
  createdAt: number;
}

export interface TopicQuery {
  name: string;
}
