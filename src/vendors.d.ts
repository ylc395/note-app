/// <reference types="vite/client" />
/// <reference types="solid-js" />

declare module 'single-file-core/single-file';
declare module 'page-lifecycle';
declare module 'text-fragments-polyfill/text-fragment-utils' {
  export function getFragmentDirectives(hash: string): { text: string[] };
  export function parseFragmentDirectives(config: { text: string[] }): {
    text: Array<{
      prefix?: string;
      textStart: string;
      textEnd?: string;
      suffix?: string;
    }>;
  };
}

declare global {
  declare module 'solid-js' {
    namespace JSX {
      interface IntrinsicElements {
        'em-emoji': {
          'attr:shortcodes'?: string;
          class?: string;
        };
      }
    }
  }
}
