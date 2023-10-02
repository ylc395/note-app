import { number, object, string, type infer as Infer, nativeEnum } from 'zod';
import pick from 'lodash/pick';
import { entityLocatorSchema, EntityTypes, type EntityWithTitle } from './entity';

const highlightPositionSchema = object({
  start: number(),
  end: number(),
});

export const contentEntityTypes = pick(EntityTypes, ['Note', 'Memo', 'Material', 'MaterialAnnotation']);

export type HighlightPosition = Infer<typeof highlightPositionSchema>;

export interface EntityWithSnippet extends EntityWithTitle<ContentEntityTypes> {
  snippet: string;
  highlight: HighlightPosition;
}

export interface TopicVO {
  name: string;
  updatedAt: number;
  entities: (EntityWithSnippet | EntityWithTitle<ContentEntityTypes>)[];
}

export type LinkToVO = EntityWithSnippet;

const linkToQuerySchema = entityLocatorSchema;

export type LinkDirection = 'to' | 'from';

export type LinkToQuery = Infer<typeof linkToQuerySchema>;

const topicDTOSchema = entityLocatorSchema.extend({
  entityType: nativeEnum(contentEntityTypes),
  name: string(),
});

const inlineTopicDTOSchema = topicDTOSchema.extend({
  position: highlightPositionSchema,
});

export const topicsDTOSchema = topicDTOSchema.array();
export const inlineTopicsDTOSchema = inlineTopicDTOSchema.array();

export type TopicDTO = Infer<typeof topicDTOSchema>;

export type InlineTopicDTO = Infer<typeof inlineTopicDTOSchema>;

const linkDTOSchema = object({
  from: entityLocatorSchema.extend({ position: highlightPositionSchema, entityType: nativeEnum(contentEntityTypes) }),
  to: entityLocatorSchema.extend({ fragmentId: string() }),
});

export const linksDTOSchema = linkDTOSchema.array();

export type LinkDTO = Infer<typeof linkDTOSchema>;

export type ContentEntityTypes =
  | EntityTypes.Material
  | EntityTypes.MaterialAnnotation
  | EntityTypes.Memo
  | EntityTypes.Note;
