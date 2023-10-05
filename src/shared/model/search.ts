import dayjs from 'dayjs';
import { array, nativeEnum, object, string, type infer as Infer, boolean } from 'zod';
import isEmpty from 'lodash/isEmpty';
import negate from 'lodash/negate';

import type { EntityId, EntityTypes } from './entity';
import type { Starable } from './star';
import { contentEntityTypes } from './content';

interface BaseSearchResult {
  entityId: string;
  title: string;
  body: string;
  highlights: { start: number; end: number; scope: Scopes }[];
}

interface CommonSearchResult extends BaseSearchResult {
  entityType: EntityTypes.Note | EntityTypes.Memo;
}

export interface MaterialAnnotationSearchResult extends BaseSearchResult {
  entityType: EntityTypes.MaterialAnnotation;
  mainEntityId: EntityId;
}

interface MaterialSearchResult extends BaseSearchResult {
  entityType: EntityTypes.Material;
  mimeType: string;
}

export type SearchResult = CommonSearchResult | MaterialSearchResult | MaterialAnnotationSearchResult;

export type SearchResultVO = SearchResult & Starable & { path: { entityId: string; title: string }[] };

export enum Scopes {
  Title = 'title',
  Body = 'body',
}

const isNotEmpty = negate(isEmpty);
const isValidDate = (v: string) => dayjs(v).isValid();

export const searchParamsSchema = object({
  terms: array(string()).min(1),
  created: object({
    from: string().refine(isValidDate).optional(),
    to: string().refine(isValidDate).optional(),
  })
    .refine(isNotEmpty)
    .optional(),
  updated: object({
    from: string().refine(isValidDate).optional(),
    to: string().refine(isValidDate).optional(),
  })
    .refine(isNotEmpty)
    .optional(),
  root: string().optional(),
  types: array(nativeEnum(contentEntityTypes)).optional(),
  scopes: array(nativeEnum(Scopes)).optional(),
  recyclables: boolean().optional(),
});

export type SearchParams = Infer<typeof searchParamsSchema>;
