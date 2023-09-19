import type { SearchParams, SearchResult } from 'model/search';

export interface SearchEngine {
  ready: Promise<void>;
  search: (q: SearchParams) => Promise<SearchResult[]>;
}

export const token = Symbol();
