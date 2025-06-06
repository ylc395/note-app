import { createEffect, For, Show, untrack } from 'solid-js';
import { Loader2Icon, EyeIcon } from 'lucide-solid';
import { action } from 'mobx';
import assert from 'assert';
import { last, pull, uniq } from 'lodash-es';

import type PdfViewer from '../PDFViewer';
import Item from './Item';

export default function Outline(props: { viewer: PdfViewer }) {
  let listRef: HTMLDivElement | undefined;

  function onToggle({ key, value }: { key: string; value: boolean }) {
    const expanded = props.viewer.editor.outline.state.get('expanded');

    if (value) {
      expanded.push(key);
    } else {
      pull(expanded, key);
    }
  }

  function handleScroll(e: Event) {
    assert(e.target instanceof HTMLElement);
    props.viewer.editor.outline.state.set('scroll', {
      x: e.target.scrollLeft,
      y: e.target.scrollTop,
    });
  }

  createEffect(() => {
    if (props.viewer.editor.outline.items && props.viewer.editor.outline.state.isReady) {
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
    assert(props.viewer.editor.outline.focusedPath);

    props.viewer.editor.outline.state.set(
      'expanded',
      uniq([...props.viewer.editor.outline.state.get('expanded'), ...props.viewer.editor.outline.focusedPath]),
    );

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
