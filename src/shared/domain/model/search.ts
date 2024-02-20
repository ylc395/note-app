import dayjs from 'dayjs';
import { array, nativeEnum, object, string, type infer as Infer, boolean } from 'zod';
import { isEmpty, negate } from 'lodash-es';

import { type EntityId, EntityTypes, type Path } from './entity.js';
import type { EntityMaterial } from './material.js';

interface SearchRecord {
  text: string;
  highlights: { start: number; end: number }[];
  location?: string; // for file and material annotation
  annotationId?: EntityId; // for material annotation
}

export type SearchableEntityType = EntityTypes.Note | EntityTypes.Memo | EntityTypes.Material;

interface BaseSearchResult {
  entityType: SearchableEntityType;
  entityId: string;
  title: SearchRecord;
  updatedAt: number;
  createdAt: number;
  icon: string | null;
  content: SearchRecord[];
}

interface MaterialSearchResult extends BaseSearchResult {
  entityType: EntityTypes.Material;
  mimeType: EntityMaterial['mimeType'];
}

export type SearchResult = BaseSearchResult | MaterialSearchResult;

export type SearchResultVO = SearchResult & { path: Path; isStar: boolean };

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
  root: string().optional(),
  scopes: array(nativeEnum(Scopes)).optional(),
  recyclables: boolean().optional(),
});

export type SearchParams = Infer<typeof searchParamsSchema>;
