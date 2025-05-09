import { createEffect, For, on, Show } from 'solid-js';
import { Loader2Icon, EyeIcon } from 'lucide-solid';
import { action } from 'mobx';
import assert from 'assert';
import { last, pull, uniq } from 'lodash-es';

import type PdfViewer from '../PDFViewer';
import Item from './Item';

export default function Outline(props: { viewer: PdfViewer }) {
  let listRef: HTMLDivElement | undefined;

  function onToggle({ key, value }: { key: string; value: boolean }) {
    assert(props.viewer.editor.uiState);

    if (value) {
      props.viewer.editor.uiState['outline.expanded'].push(key);
    } else {
      pull(props.viewer.editor.uiState['outline.expanded'], key);
    }
  }

  function handleScroll(e: Event) {
    assert(e.target instanceof HTMLElement && props.viewer.editor.uiState);
    props.viewer.editor.uiState['outline.scroll'] = {
      x: e.target.scrollLeft,
      y: e.target.scrollTop,
    };
  }

  createEffect(
    on(
      () => props.viewer.editor.outline.items,
      () => {
        if (props.viewer.editor.uiState?.['outline.scroll']) {
          listRef!.scrollLeft = props.viewer.editor.uiState['outline.scroll'].x;
          listRef!.scrollTop = props.viewer.editor.uiState['outline.scroll'].y;
        }
      },
    ),
  );

  function scrollToFocused() {
    assert(props.viewer.editor.uiState && props.viewer.editor.outline.focusedPath);

    props.viewer.editor.uiState['outline.expanded'] = uniq([
      ...props.viewer.editor.uiState['outline.expanded'],
      ...props.viewer.editor.outline.focusedPath,
    ]);

    const item = listRef?.querySelector(`[data-outline-item-key="${last(props.viewer.editor.outline.focusedPath)}"]`);

    if (item) {
      item.scrollIntoView();
    }
  }

  return (
    <div
      class="w-64 overflow-auto h-full border-r pb-12 flex flex-col"
      ref={listRef}
      onScrollEnd={action(handleScroll)}
    >
      <div class="top-0 bg-gray-50 flex justify-end">
        <button class="flex items-center text-sm" onClick={scrollToFocused}>
          <EyeIcon class="mr-1" />
          当前浏览
        </button>
      </div>
      <Show
        when={!props.viewer.editor.outline.items || props.viewer.editor.outline.items.length > 0}
        fallback={<div class="flex h-full justify-center items-center">无大纲</div>}
      >
        <div class="min-h-0 overflow-auto">
          <For
            each={props.viewer.editor.outline.items}
            fallback={
              <div class="flex h-full justify-center items-center">
                <Loader2Icon class="animate-spin mr-2" />
                <span>加载中</span>
              </div>
            }
          >
            {(outline) => <Item onToggle={action(onToggle)} viewer={props.viewer} item={outline} level={0} />}
          </For>
        </div>
      </Show>
    </div>
  );
}
