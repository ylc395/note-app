import { createEffect, createMemo, createSignal, onMount } from 'solid-js';
import { createLazyMemo } from '@solid-primitives/memo';
import { Readability } from '@mozilla/readability';
import DOMPurify from 'dompurify';
import assert from 'assert';

import HtmlEditor from '#domain/client/app/model/note/editor/HtmlEditor';
import { useContext } from '../context';

export default function HtmlEditorView() {
  const { editor } = useContext()!;
  const [pageType, setPageType] = createSignal<'complete' | 'simple'>('complete');
  let htmlRendererRef: HTMLDivElement | undefined;

  const simpleHtml = createLazyMemo(() => {
    assert(editor instanceof HtmlEditor);

    if (!editor.html) {
      return null;
    }

    const doc = new DOMParser().parseFromString(editor.html, 'text/html');
    return new Readability(doc).parse();
  });

  const html = createMemo(() => {
    if (pageType() === 'simple') {
      return simpleHtml()?.content;
    }

    assert(editor instanceof HtmlEditor);
    return editor.html || null;
  });

  onMount(() => {
    htmlRendererRef!.attachShadow({ mode: 'open' });
  });

  createEffect(() => {
    const htmlValue = html();

    if (htmlValue) {
      const dom = DOMPurify.sanitize(htmlValue, { RETURN_DOM_FRAGMENT: true, WHOLE_DOCUMENT: true });
      htmlRendererRef!.shadowRoot!.replaceChildren(dom);
    }
  });

  return (
    <div class="grow min-h-0 relative flex flex-col">
      <div class="absolute top-0 left-0 right-0 flex z-10">
        <small>网页中的 JS 脚本不会被运行</small>
        <div>
          <button onClick={() => setPageType('simple')}>精简版</button>
          <button onClick={() => setPageType('complete')}>完整版</button>
        </div>
      </div>
      <div class="min-h-0 grow overflow-auto px-inset-square-xl pt-inset-square-xl pb-40 select-text">
        <div ref={htmlRendererRef} class="all-initial"></div>
      </div>
    </div>
  );
}
