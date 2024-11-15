declare module 'single-file-core/single-file';
declare module 'page-lifecycle';

declare module 'text-fragments-polyfill/text-fragment-utils' {
  interface TextFragment {
    textStart: string;
    textEnd: string;
    prefix: string;
    suffix: string;
  }
  export function getFragmentDirectives(hash: string): { text?: string[] };
  export function parseFragmentDirectives(fragmentDirectives: { text: string[] }): { text: TextFragment[] };
}

declare module 'pdfjs-dist/build/pdf.worker.min.mjs?worker' {
  declare const constructor: {
    new (): Worker;
  };

  export default constructor;
}
