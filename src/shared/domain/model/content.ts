import { number, object, string, type infer as Infer } from 'zod';
import { EntityTypes, type EntityWithTitle } from './entity.js';

const highlightPositionSchema = object({
  start: number(),
  end: number(),
});

export type HighlightPosition = Infer<typeof highlightPositionSchema>;

export interface EntityWithSnippet extends EntityWithTitle {
  snippet: string;
  highlight: HighlightPosition;
}

export interface TopicVO {
  name: string;
  updatedAt: number;
  entities: EntityWithSnippet[];
}

export type LinkToVO = EntityWithSnippet;

const linkToQuerySchema = object({ entityId: string() });

export type LinkDirection = 'to' | 'from';

export type LinkToQuery = Infer<typeof linkToQuerySchema>;

const topicDTOSchema = object({
  entityId: string(),
  position: highlightPositionSchema,
  name: string(),
});

export const topicsDTOSchema = topicDTOSchema.array();

export type TopicDTO = Infer<typeof topicDTOSchema>;

const linkDTOSchema = object({
  from: object({ entityId: string(), position: highlightPositionSchema }),
  to: object({ entityId: string(), fragmentId: string() }),
});

export const linksDTOSchema = linkDTOSchema.array();

export type LinkDTO = Infer<typeof linkDTOSchema>;

export type ContentEntityTypes = EntityTypes.Material | EntityTypes.Annotation | EntityTypes.Memo | EntityTypes.Note;
