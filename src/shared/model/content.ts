import { number, object, string, type infer as Infer } from 'zod';
import { type EntityLocator, entityLocatorSchema } from './entity';

const highlightPositionSchema = object({
  start: number(),
  end: number(),
});

export type HighlightPosition = Infer<typeof highlightPositionSchema>;

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

export type LinkToVO = EntityWithSnippet;

const linkToQuerySchema = entityLocatorSchema;

export type LinkDirection = 'to' | 'from';

export type LinkToQuery = Infer<typeof linkToQuerySchema>;

const topicDTOSchema = entityLocatorSchema.extend({
  name: string(),
  position: highlightPositionSchema,
});

export const topicsDTOSchema = topicDTOSchema.array();

export type TopicDTO = Infer<typeof topicDTOSchema>;

const linkDTOSchema = object({
  from: entityLocatorSchema.extend({ position: highlightPositionSchema }),
  to: entityLocatorSchema.extend({ fragmentId: string() }),
});

export const linksDTOSchema = linkDTOSchema.array();

export type LinkDTO = Infer<typeof linkDTOSchema>;
