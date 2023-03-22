export interface Range {
  from: number;
  to: number;
}

export interface SearchState {
  ranges: Range[];
  activeIndex: number;
}
