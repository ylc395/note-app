import { createEffect, createMemo, createSignal, For, onCleanup, Show, untrack } from 'solid-js';
import { LoaderCircleIcon, EyeIcon } from 'lucide-solid';
import assert from 'assert';
import { action } from 'mobx';

import Item from './Item';
import OutlineViewModel from './Outline';
import { useContext } from '../context';

export default function Outline(props: Record<string, unknown>) {
  const { viewer } = useContext()!;
  const [listRef, setListRef] = createSignal<HTMLDivElement>();
  const outline = new OutlineViewModel(viewer);
  const uiState = viewer.editor.outline.uiState;
  const styles = createMemo(
    () => uiState.isFloating && { left: `${uiState.floatingPos?.x || 0}px`, top: `${uiState.floatingPos?.y || 0}px` },
  );

  onCleanup(() => {
    outline.destroy();
  });

  function handleScroll(e: Event) {
    assert(e.target instanceof HTMLElement);

    uiState.scroll = {
      x: e.target.scrollLeft,
      y: e.target.scrollTop,
    };
  }

  createEffect(() => {
    const listElement = listRef();

    if (
      listElement &&
      viewer.editor.outline.items &&
      outline.expandedKeys // 确保已完成展开
    ) {
      const scroll = untrack(() => viewer.editor.outline.uiState?.scroll);

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

  function toggleFloating() {
    uiState.isFloating = !uiState.isFloating;
  }

  return (
    <div
      class="overflow-auto h-full border-r pb-4 flex flex-col"
      classList={{ absolute: uiState.isFloating }}
      {...props}
      style={{ ...(props.style || {}), ...styles() }}
    >
      <Show
        when={!viewer.editor.outline.items || viewer.editor.outline.items.length > 0}
        fallback={<div class="flex h-full justify-center items-center">无大纲</div>}
      >
        <div class="top-0 bg-gray-50 flex justify-end">
          <button class="flex items-center text-sm" onClick={scrollToFocused}>
            <EyeIcon class="mr-1" />
            当前浏览
          </button>
          <button class="flex items-center text-sm" onClick={action(toggleFloating)}>
            <EyeIcon class="mr-1" />
            悬浮
          </button>
        </div>
        <div class="min-h-0 overflow-auto" ref={setListRef} onScrollEnd={action(handleScroll)}>
          <For
            each={viewer.editor.outline.items}
            fallback={
              <div class="flex h-full justify-center items-center overflow-hidden space-x-1">
                <LoaderCircleIcon class="animate-spin" />
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
