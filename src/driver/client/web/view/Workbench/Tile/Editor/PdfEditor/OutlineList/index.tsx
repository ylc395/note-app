import { createEffect, createSignal, For, onCleanup, Show, untrack } from 'solid-js';
import { LoaderCircleIcon, EyeIcon } from 'lucide-solid';
import assert from 'assert';
import { action } from 'mobx';
import { useSplitterContext } from '@ark-ui/solid';

import Item from './Item';
import OutlineViewModel from './Outline';
import { useContext } from '../context';
import useFloatingPanel from '#web/components/useFloatingPanel';

export default function Outline(props: { id: string }) {
  const { viewer } = useContext()!;
  const splitter = useSplitterContext();
  const [listRef, setListRef] = createSignal<HTMLDivElement>();

  const outline = new OutlineViewModel(viewer);
  const uiState = viewer.editor.outline.uiState;

  const { setHandlerRef, setPanelRef } = useFloatingPanel({
    isEnabled: () => Boolean(uiState.isFloating),
    initialPos: () => uiState.floatingPos,
    onMoveEnd: action(({ x, y }) => {
      uiState.floatingPos = { ...uiState.floatingPos, x, y };
    }),
  });

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
      ref={setPanelRef}
      class="overflow-auto h-full border-r pb-4 flex flex-col"
      {...(uiState.isFloating ? null : splitter().getPanelProps({ id: props.id }))}
    >
      <div ref={setHandlerRef} class="top-0 bg-gray-50 flex">
        <h4>大纲</h4>
        <div class="flex items-center justify-end grow">
          <button class="flex items-center text-sm" onClick={scrollToFocused}>
            <EyeIcon class="mr-1" />
            当前浏览
          </button>
          <button class="flex items-center text-sm" onClick={action(toggleFloating)}>
            <EyeIcon class="mr-1" />
            悬浮
          </button>
        </div>
      </div>
      <Show
        when={!viewer.editor.outline.items || viewer.editor.outline.items.length > 0}
        fallback={<div class="flex h-full justify-center items-center">无大纲</div>}
      >
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
