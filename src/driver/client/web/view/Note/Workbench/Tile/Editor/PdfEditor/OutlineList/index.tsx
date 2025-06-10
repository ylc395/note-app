import { createEffect, For, onCleanup, Show, untrack } from 'solid-js';
import { Loader2Icon, EyeIcon } from 'lucide-solid';
import { action } from 'mobx';
import assert from 'assert';

import type PdfViewer from '../PDFViewer';
import Item from './Item';
import OutlineModel from './Outline';

export default function Outline(props: { viewer: PdfViewer }) {
  let listRef: HTMLDivElement | undefined;

  const outline = new OutlineModel(props.viewer);

  onCleanup(() => {
    outline.destroy();
  });

  function handleScroll(e: Event) {
    assert(e.target instanceof HTMLElement);
    props.viewer.editor.outline.state.set('scroll', {
      x: e.target.scrollLeft,
      y: e.target.scrollTop,
    });
  }

  createEffect(() => {
    if (props.viewer.editor.outline.items && props.viewer.editor.outline.state.isReady && outline.expandedKeys) {
      untrack(() => {
        const scroll = props.viewer.editor.outline.state.get('scroll');

        if (scroll && listRef) {
          listRef.scrollLeft = scroll.x;
          listRef.scrollTop = scroll.y;
        }
      });
    }
  });

  function scrollToFocused() {
    const key = outline.expandToFocus();
    const item = key && listRef?.querySelector(`[data-outline-item-key="${key}"]`);

    if (item) {
      item.scrollIntoView();
    }
  }

  return (
    <div class="w-64 overflow-auto h-full border-r pb-12 flex flex-col">
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
        <div class="min-h-0 overflow-auto" ref={listRef} onScrollEnd={action(handleScroll)}>
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
