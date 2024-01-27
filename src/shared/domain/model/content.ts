import { number, object, string, type infer as Infer, nativeEnum } from 'zod';
import { pick } from 'lodash-es';
import { entityLocatorSchema, EntityTypes, type EntityWithTitle } from './entity.js';

const highlightPositionSchema = object({
  start: number(),
  end: number(),
});

const contentEntityTypesSchema = nativeEnum(pick(EntityTypes, ['Note', 'Memo', 'Material', 'Annotation'] as const));

export type HighlightPosition = Infer<typeof highlightPositionSchema>;

export interface EntityWithSnippet extends EntityWithTitle<ContentEntityTypes> {
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
  entityType: contentEntityTypesSchema,
  position: highlightPositionSchema,
  name: string(),
});

export const topicsDTOSchema = topicDTOSchema.array();

export type TopicDTO = Infer<typeof topicDTOSchema>;

const linkDTOSchema = object({
  from: entityLocatorSchema.extend({ position: highlightPositionSchema, entityType: contentEntityTypesSchema }),
  to: entityLocatorSchema.extend({ fragmentId: string() }),
});

export const linksDTOSchema = linkDTOSchema.array();

export type LinkDTO = Infer<typeof linkDTOSchema>;

export type ContentEntityTypes = EntityTypes.Material | EntityTypes.Annotation | EntityTypes.Memo | EntityTypes.Note;
