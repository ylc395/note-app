export interface PDFFragment {
  page: number;
  height: number;
  width: number;
  left: number;
  top: number;
}

// inspired by https://www.w3.org/TR/media-frags/#fragment-dimensions
export interface MediaFragment {
  start: number;
  end: number;
}

// inspired by https://developer.mozilla.org/en-US/docs/Web/Text_fragments#syntax
// and https://www.w3.org/TR/annotation-model/#text-quote-selector
export interface TextQuoteFragment {
  start: string;
  end?: string;
  prefix?: string;
  suffix?: string;
}
