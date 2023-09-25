import { object, string, type infer as Infer } from 'zod';
import type { EntityLocator } from './entity';

export interface Pos {
  start: number;
  end: number;
}

interface EntityWithDigest extends EntityLocator {
  title: string;
  digest: string;
  highlightPos: Pos;
}

export interface TopicVO {
  name: string;
  updatedAt: number;
  entities: EntityWithDigest[];
}

export type LinkFromVO = EntityWithDigest;

export const topicQuerySchema = object({ name: string() });

export type TopicQuery = Infer<typeof topicQuerySchema>;
