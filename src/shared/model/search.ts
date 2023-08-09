import dayjs from 'dayjs';
import { array, nativeEnum, object, string, type infer as Infer } from 'zod';
import isEmpty from 'lodash/isEmpty';
import negate from 'lodash/negate';

import type { EntityId } from 'model/entity';

export interface SearchResult {
  title: string;
  content: string;
  type: Types;
  entityId: EntityId;
  mainEntityId?: EntityId;
  // path: string;
}

export enum Types {
  Note = 'note',
  Memo = 'memo',
  Pdf = 'pdf',
  Html = 'html',
}

export enum Scopes {
  Title = 'title',
  Body = 'body',
  Annotation = 'annotation',
}

const isNotEmpty = negate(isEmpty);
const isValidDate = (v: string) => dayjs(v).isValid();

export const searchQuerySchema = object({
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
  types: array(nativeEnum(Types)).optional(),
  scopes: array(nativeEnum(Scopes)).optional(),
});

export type SearchQuery = Infer<typeof searchQuerySchema>;
