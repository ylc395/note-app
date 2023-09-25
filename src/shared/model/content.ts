import { object, string, type infer as Infer } from 'zod';
import type { EntityLocator } from './entity';

export interface HighlightPosition {
  start: number;
  end: number;
}

export interface EntityWithSnippet extends EntityLocator {
  title: string;
  snippet: string;
  highlight: HighlightPosition;
}

export interface TopicVO {
  name: string;
  updatedAt: number;
  entities: EntityWithSnippet[];
}

export type LinkFromVO = EntityWithSnippet;

export const topicQuerySchema = object({ name: string() });

export type TopicQuery = Infer<typeof topicQuerySchema>;
