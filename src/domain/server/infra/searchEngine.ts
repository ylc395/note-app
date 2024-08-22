import type { SearchRequest, SearchResult } from '@domain/shared/model/search.js';
import type { InjectionToken } from 'tsyringe';

export interface SearchEngine {
  ready: Promise<void>;
  search: (q: SearchRequest) => Promise<SearchResult[]>;
}

export const token: InjectionToken<SearchEngine> = Symbol();
