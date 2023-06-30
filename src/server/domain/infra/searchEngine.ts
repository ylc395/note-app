import type { EntityLocator } from 'interface/entity';
import type { SearchQuery, SearchResult } from 'interface/search';

export interface SearchEngine {
  ready: Promise<void>;
  search: (q: SearchQuery) => Promise<SearchResult[]>;
  remove: (entities: EntityLocator[]) => Promise<void>;
}

export const token = Symbol();

export { type SearchQuery, type SearchResult, Types, Scopes } from 'interface/search';
