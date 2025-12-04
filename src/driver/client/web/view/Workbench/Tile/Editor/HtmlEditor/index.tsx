import { createEffect, createMemo, onMount } from 'solid-js';
import assert from 'assert';

import HtmlEditor from '#domain/client/app/model/note/editor/HtmlEditor';
import useHtml from './useHtml';
import { useContext } from '../context';

export default function HtmlEditorView() {
  const { editor } = useContext()!;
  const html = createMemo(() => {
    assert(editor instanceof HtmlEditor);
    return editor.html || null;
  });

  let htmlRendererRef: HTMLDivElement | undefined;
  const { dom, setPageType } = useHtml(html);

  onMount(() => {
    htmlRendererRef!.attachShadow({ mode: 'open' });
  });

  createEffect(() => {
    const domValue = dom();

    if (domValue) {
      // 这里必须 clone 下文档片段。因为文档片段一旦被置入 DOM 树中，该文档片段将被清空
      htmlRendererRef!.shadowRoot!.replaceChildren(domValue.cloneNode(true));
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
