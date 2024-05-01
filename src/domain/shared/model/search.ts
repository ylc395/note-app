import dayjs from 'dayjs';
import { array, nativeEnum, object, string, type infer as Infer, boolean, number, union, literal } from 'zod';
import { isEmpty, negate } from 'lodash-es';

import { EntityId, EntityTypes, Path } from './entity.js';
import type { EntityMaterial } from './material.js';

export type SearchTypes = EntityTypes.Note | EntityTypes.Memo | EntityTypes.Material;

export enum SearchFields {
  Title = 'title',
  Content = 'content',
  Annotation = 'annotation',
  MaterialFile = 'materialFile',
}

interface MatchRecord {
  text: string;
  highlights: { start: number; end: number }[];
  location?: { page?: number };
}

export interface CommonSearchResult {
  entityType: SearchTypes;
  entityId: EntityId;
  updatedAt: number;
  createdAt: number;
  icon: string | null;
  matches: {
    [SearchFields.Title]?: MatchRecord;
    [SearchFields.Content]?: MatchRecord;
    [SearchFields.MaterialFile]?: MatchRecord[];
    [SearchFields.Annotation]?: MatchRecord[];
  };
  path?: Path;
  title?: string;
}

interface MaterialSearchResult extends CommonSearchResult {
  entityType: EntityTypes.Material;
  mimeType?: EntityMaterial['mimeType'];
}

export type SearchResult = CommonSearchResult | MaterialSearchResult;

export type SearchResultVO = Required<SearchResult>;

const isNotEmpty = negate(isEmpty);
const isValidDate = (v: number) => dayjs(v).isValid();

export const searchParamsSchema = object({
  keyword: string().min(1),
  created: object({
    after: number().refine(isValidDate).optional(),
    before: number().refine(isValidDate).optional(),
  })
    .refine(isNotEmpty)
    .optional(),
  updated: object({
    after: number().refine(isValidDate).optional(),
    before: number().refine(isValidDate).optional(),
  })
    .refine(isNotEmpty)
    .optional(),
  root: string().optional(),
  types: union([literal(EntityTypes.Note), literal(EntityTypes.Memo), literal(EntityTypes.Material)])
    .array()
    .optional(),
  fields: array(nativeEnum(SearchFields)).optional(),
  recyclables: boolean().optional(),
});

export type SearchParams = Infer<typeof searchParamsSchema>;
