import dayjs from 'dayjs';
import { array, nativeEnum, object, string, type infer as Infer, boolean } from 'zod';
import isEmpty from 'lodash/isEmpty';
import negate from 'lodash/negate';

import { type EntityId, type EntityTypes, hierarchyEntityLocatorSchema } from './entity';
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

export type SearchResultVO = SearchResult &
  Starable & {
    path: { entityId: string; title: string }[];
  };

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

export type SearchParams = Infer<typeof searchParamsSchema>;
