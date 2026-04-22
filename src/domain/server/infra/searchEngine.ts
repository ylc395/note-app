import type { Token } from '#utils/singletonContainer';
import type { SearchRequest, SearchResult } from '#domain/shared/model/search.js';

export interface SearchEngine {
  ready: Promise<void>;
  // 防止不符合预期的传参，强制要求所有字段都传
  search: (q: Required<SearchRequest>) => Promise<SearchResult[]>;
}

export const token: Token<SearchEngine> = Symbol('searchEngine');
