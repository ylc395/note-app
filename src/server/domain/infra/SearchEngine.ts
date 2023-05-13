import type { EntityTypes } from 'interface/entity';
import type { SearchResultVO } from 'interface/search';

export interface SearchQuery {
  all: string[];
  content: string[];
  title: string[];
  type: EntityTypes[];
}

export interface SearchEngine {
  init: () => Promise<void>;
  search: (q: SearchQuery) => Promise<SearchResultVO[]>;
}

export const token = Symbol();
