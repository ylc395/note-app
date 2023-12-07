import type { SearchParams, SearchResult } from '@domain/model/search.js';

export interface SearchEngine {
  ready: Promise<void>;
  search: (q: SearchParams) => Promise<SearchResult[]>;
}

export const token = Symbol();
