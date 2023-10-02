import dayjs from 'dayjs';
import { array, nativeEnum, object, string, type infer as Infer, boolean } from 'zod';
import isEmpty from 'lodash/isEmpty';
import negate from 'lodash/negate';

import type { EntityId, EntityWithTitle } from './entity';
import type { Starable } from './star';
import { type ContentEntityTypes, contentEntityTypes } from './content';

export interface SearchResult extends EntityWithTitle<ContentEntityTypes> {
  body: string;
  highlights: { start: number; end: number; scope: Scopes }[];
  mainEntityId?: EntityId;
  mimeType?: string;
}

export interface SearchResultVO extends SearchResult, Starable {
  path: string;
}

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
