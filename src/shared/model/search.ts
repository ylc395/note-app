import dayjs from 'dayjs';
import { array, nativeEnum, object, string, type infer as Infer, boolean } from 'zod';
import isEmpty from 'lodash/isEmpty';
import negate from 'lodash/negate';
import pick from 'lodash/pick';

import { type EntityId, EntityTypes, hierarchyEntityLocatorSchema, Path } from './entity';
import type { Starable } from './star';
import type { MaterialEntity } from './material';

interface SearchRecord {
  text: string;
  highlights: { start: number; end: number }[];
  location?: string; // for file and material annotation
  annotationId?: EntityId; // for material annotation
}

interface BaseSearchResult {
  entityId: string;
  title: SearchRecord;
  updatedAt: number;
  createdAt: number;
  content: SearchRecord[];
}

export interface CommonSearchResult extends BaseSearchResult {
  entityType: EntityTypes.Note | EntityTypes.Memo;
}

interface MaterialSearchResult extends BaseSearchResult {
  entityType: EntityTypes.Material;
  mimeType: MaterialEntity['mimeType'];
}

export type SearchResult = CommonSearchResult | MaterialSearchResult;

export type SearchResultVO = SearchResult & Starable & { path: Path };

export enum Scopes {
  NoteTitle = 1,
  NoteBody,
  NoteFile,
  MaterialTitle,
  MaterialComment,
  MaterialContent,
  MaterialAnnotation,
  MaterialAnnotationFile,
  MemoContent,
  MemoFile,
}

const isNotEmpty = negate(isEmpty);
const isValidDate = (v: string) => dayjs(v).isValid();

export const searchParamsSchema = object({
  keyword: string().min(1),
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
  root: hierarchyEntityLocatorSchema.optional(),
  scopes: array(nativeEnum(Scopes)).optional(),
  recyclables: boolean().optional(),
});

export const searchTreeParamsSchema = object({
  keyword: string().min(1),
  type: nativeEnum(pick(EntityTypes, ['Note', 'Material', 'Memo'] as const)),
  containBody: boolean().optional(),
});

export type SearchParams = Infer<typeof searchParamsSchema>;

export type SearchTreeParams = Infer<typeof searchTreeParamsSchema>;
