import { createEffect, createSignal, For, onCleanup, Show, untrack } from 'solid-js';
import { Loader2Icon, EyeIcon } from 'lucide-solid';
import assert from 'assert';

import type PdfViewer from '../PDFViewer';
import Item from './Item';
import OutlineViewModel from './Outline';

export default function Outline(props: { viewer: PdfViewer }) {
  const [listRef, setListRef] = createSignal<HTMLDivElement>();
  const outline = new OutlineViewModel(props.viewer);

  onCleanup(() => {
    outline.destroy();
  });

  function handleScroll(e: Event) {
    assert(e.target instanceof HTMLElement && props.viewer.editor.outline.uiState);

    props.viewer.editor.outline.uiState.scroll = {
      x: e.target.scrollLeft,
      y: e.target.scrollTop,
    };
  }

  createEffect(() => {
    const listElement = listRef();

    if (
      listElement &&
      props.viewer.editor.outline.items &&
      outline.expandedKeys && // 确保已完成展开
      props.viewer.editor.outline.uiState
    ) {
      const scroll = untrack(() => props.viewer.editor.outline.uiState?.scroll);

      if (scroll) {
        assert(listRef, 'no listRef');
        listElement.scrollLeft = scroll.x;
        listElement.scrollTop = scroll.y;
      }
    }
  });

  function scrollToFocused() {
    const key = outline.expandToFocus();
    const item = key && listRef()?.querySelector(`[data-outline-item-key="${key}"]`);

    if (item) {
      item.scrollIntoView({ block: 'center' });
    }
  }

  return (
    <div class="w-64 overflow-auto h-full border-r pb-4 flex flex-col">
      <Show
        when={!props.viewer.editor.outline.items || props.viewer.editor.outline.items.length > 0}
        fallback={<div class="flex h-full justify-center items-center">无大纲</div>}
      >
        <div class="top-0 bg-gray-50 flex justify-end">
          <button class="flex items-center text-sm" onClick={scrollToFocused}>
            <EyeIcon class="mr-1" />
            当前浏览
          </button>
        </div>
        <div class="min-h-0 overflow-auto" ref={setListRef} onScrollEnd={handleScroll}>
          <For
            each={props.viewer.editor.outline.items}
            fallback={
              <div class="flex h-full justify-center items-center overflow-hidden space-x-1">
                <Loader2Icon class="animate-spin" />
                <span>加载中</span>
              </div>
            }
          >
            {(item) => <Item outline={outline} onToggle={outline.toggleExpand} item={item} level={0} />}
          </For>
        </div>
      </Show>
    </div>
  );
}
