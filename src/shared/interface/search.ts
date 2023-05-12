import { object, string, infer as Infer } from 'zod';
import type { EntityId, EntityTypes } from './entity';

export interface SearchResultVO {
  title?: string;
  snippet: string;
  entityType: EntityTypes;
  entityId: EntityId;
}

export const searchQuerySchema = object({ q: string().min(1) });

export type SearchQuery = Infer<typeof searchQuerySchema>;
