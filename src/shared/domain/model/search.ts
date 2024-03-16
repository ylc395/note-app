import dayjs from 'dayjs';
import { array, nativeEnum, object, string, type infer as Infer, boolean } from 'zod';
import { isEmpty, negate } from 'lodash-es';

import type { EntityId, EntityTypes, Path } from './entity.js';
import type { EntityMaterial } from './material.js';

export enum Scopes {
  NoteTitle = 1,
  NoteBody,
  NoteFile,
  NoteAnnotation,
  NoteAnnotationFile,
  MaterialTitle,
  MaterialComment,
  MaterialFile,
  MaterialAnnotation,
  MaterialAnnotationFile,
  MemoContent,
  MemoFile,
}

interface MatchRecord {
  text: string;
  highlights: { start: number; end: number }[];
  type: Scopes;
  location?: string; // for file and annotation
}

type SearchableEntityType = EntityTypes.Note | EntityTypes.Memo | EntityTypes.Material;

interface BaseSearchResult {
  entityType: SearchableEntityType;
  entityId: EntityId;
  updatedAt: number;
  createdAt: number;
  icon: string | null;
  matches: MatchRecord[];
  path?: Path;
}

interface MaterialSearchResult extends BaseSearchResult {
  entityType: EntityTypes.Material;
  mimeType: EntityMaterial['mimeType'];
}

export type SearchResult = BaseSearchResult | MaterialSearchResult;

export type SearchResultVO = Required<SearchResult>;

const isNotEmpty = negate(isEmpty);
const isValidDate = (v: string) => dayjs(v).isValid();

export const searchParamsSchema = object({
  keyword: string().min(1),
  created: object({
    after: string().refine(isValidDate).optional(),
    before: string().refine(isValidDate).optional(),
  })
    .optional()
    .refine(isNotEmpty),
  updated: object({
    after: string().refine(isValidDate).optional(),
    before: string().refine(isValidDate).optional(),
  })
    .optional()
    .refine(isNotEmpty),
  root: string().optional(),
  scopes: array(nativeEnum(Scopes)).optional(),
  recyclables: boolean().optional(),
});

export type SearchParams = Infer<typeof searchParamsSchema>;
