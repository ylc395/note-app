/* 
通常来说，fragment id 可解释为一批 k-v pairs
在这里，我们不定义具体的 k-v。一些有意义的 k-v 可参考：

PDF：https://datatracker.ietf.org/doc/html/rfc3778#section-3
多媒体：https://www.w3.org/TR/media-frags/#fragment-dimensions
*/
export type CommonFragment = Record<string, string>;

// inspired by https://developer.mozilla.org/en-US/docs/Web/Text_fragments#syntax
// and https://www.w3.org/TR/annotation-model/#text-quote-selector
export interface TextQuoteFragment {
  start: string;
  end?: string;
  prefix?: string;
  suffix?: string;
}
