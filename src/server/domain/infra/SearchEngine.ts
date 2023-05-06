export interface SearchResult {
  title?: string;
  snippet: string;
}

export interface SearchEngine {
  search: () => Promise<SearchResult[]>;
}

export const token = Symbol();
