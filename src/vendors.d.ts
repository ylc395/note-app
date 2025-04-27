/// <reference types="vite/client" />

declare module 'single-file-core/single-file';
declare module 'page-lifecycle';

declare module 'text-fragments-polyfill/dist/fragment-generation-utils.js' {
  export function generateFragmentFromRange(range: Range): {
    status: number;
    fragment?: {
      textStart: string;
      textEnd?: string;
      prefix?: string;
      suffix?: string;
    };
  };
}

declare module 'text-fragments-polyfill/text-fragment-utils' {
  interface TextFragment {
    textStart: string;
    textEnd?: string;
    prefix?: string;
    suffix?: string;
  }
  export function removeMarks(marks: Node[]): void;
  export function getFragmentDirectives(hash: string): { text?: string[] };
  export function parseFragmentDirectives(fragmentDirectives: { text: string[] }): { text: TextFragment[] };
  export function processFragmentDirectives(
    fragment: { text: TextFragment[] },
    document?: Document,
    container?: Element,
  ): { text: Element[][] };
}
