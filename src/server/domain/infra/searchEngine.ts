import type { SearchParams, SearchResult } from '@domain/model/search.js';
import type { InjectionToken } from 'tsyringe';

export interface SearchEngine {
  ready: Promise<void>;
  search: (q: SearchParams) => Promise<SearchResult[]>;
}

export const token: InjectionToken<SearchEngine> = Symbol();
