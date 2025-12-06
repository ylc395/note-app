import { createMemo, createSignal, type Accessor } from 'solid-js';
import { createLazyMemo } from '@solid-primitives/memo';
import { Readability } from '@mozilla/readability';
import DOMPurify from 'dompurify';

const dompurifyOptions = {
  RETURN_DOM_FRAGMENT: true,
  WHOLE_DOCUMENT: true,
  KEEP_CONTENT: false,
  // dompurify 移除了大部分外联元素（例如 <object>），我们额外移除掉视频和音频。图片仍然保留
  // https://github.com/cure53/DOMPurify/blob/main/src/tags.ts
  FORBID_TAGS: ['audio', 'video'],
  SAFE_FOR_XML: false, // 这个选项会把包含 svg 图像的 <style> 给误杀掉
} as const satisfies Parameters<typeof DOMPurify.sanitize>[1];

function processCss(doc: DocumentFragment) {
  const styles = doc.querySelectorAll('style');

  for (const style of styles) {
    // 简单用字符串处理下，就不解析 CSS 了
    style.textContent = style.textContent.replaceAll(':root', ':host');
  }
}

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

    if (!htmlValue) {
      return null;
    }

    const doc = DOMPurify.sanitize(htmlValue, dompurifyOptions);
    processCss(doc);

    return doc;
  });

  const dom = createMemo(() => {
    if (pageType() === 'simple') {
      return simpleHtmlText();
    }

    return completeHtmlText();
  });

  return { dom, setPageType, title };
}
