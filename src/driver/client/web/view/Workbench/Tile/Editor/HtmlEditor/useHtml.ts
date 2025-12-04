import { createMemo, createSignal, type Accessor } from 'solid-js';
import { createLazyMemo } from '@solid-primitives/memo';
import { Readability } from '@mozilla/readability';
import DOMPurify from 'dompurify';

const dompurifyOptions = {
  RETURN_DOM_FRAGMENT: true,
  WHOLE_DOCUMENT: true,
  SAFE_FOR_XML: false, // 这个选项容易误杀 <style>
} as const;

export default function useHtml(html: Accessor<string | null>) {
  const [pageType, setPageType] = createSignal<'complete' | 'simple'>('complete');

  const simpleHtml = createLazyMemo(() => {
    const htmlValue = html();

    if (!htmlValue) {
      return null;
    }

    const doc = new DOMParser().parseFromString(htmlValue, 'text/html');
    return new Readability(doc).parse();
  });

  const title = createLazyMemo(() => simpleHtml()?.title);

  const simpleHtmlText = createLazyMemo(() => {
    const content = simpleHtml()?.content;

    if (!content) {
      return null;
    }

    return DOMPurify.sanitize(content, dompurifyOptions);
  });

  const completeHtmlText = createLazyMemo(() => {
    const htmlValue = html();
    return htmlValue ? DOMPurify.sanitize(htmlValue, dompurifyOptions) : null;
  });

  const dom = createMemo(() => {
    if (pageType() === 'simple') {
      return simpleHtmlText();
    }

    return completeHtmlText();
  });

  return { dom, setPageType, title };
}
