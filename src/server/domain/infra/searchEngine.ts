import type { SearchQuery, SearchResult } from 'interface/search';

export interface SearchEngine {
  ready: Promise<void>;
  search: (q: SearchQuery) => Promise<SearchResult[]>;
}

export const token = Symbol();

export { type SearchQuery, type SearchResult, Types, Scopes } from 'interface/search';
