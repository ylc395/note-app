import type { Token } from '#utils/singletonContainer';
import type { SearchRequest, SearchResult } from '#domain/shared/model/search.js';

export interface SearchEngine {
  ready: Promise<void>;
  search: (q: SearchRequest) => Promise<SearchResult[]>;
}

export const token: Token<SearchEngine> = Symbol('searchEngine');
