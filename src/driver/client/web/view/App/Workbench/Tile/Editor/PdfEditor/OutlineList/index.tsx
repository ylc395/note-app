import { createEffect, createSignal, For, onCleanup, Show, untrack } from 'solid-js';
import { LoaderCircleIcon, EyeIcon } from 'lucide-solid';
import assert from 'assert';
import { action } from 'mobx';
import { useSplitterContext } from '@ark-ui/solid';

import FloatingPanel from '#web/view/components/FloatingPanel';
import Item from './Item';
import Resizable from '#web/view/components/Resizable';
import OutlineViewModel from './Outline';
import { useContext } from '../context';

export default function Outline(props: { id: string }) {
  const { viewer } = useContext()!;
  const splitter = useSplitterContext();
  const [listRef, setListRef] = createSignal<HTMLDivElement>();
  const uiState = viewer.editor.outline.uiState;

  const [floatingSize, setFloatingSize] = createSignal(uiState.floatingSize || { width: 300, height: 500 });
  const [floatingPos, setFloatingPos] = createSignal(uiState.floatingPos || { x: 20, y: 20 });
  const outline = new OutlineViewModel(viewer);

  onCleanup(() => {
    outline.destroy();
  });

  function handleResizeEnd(size: { width: number; height: number }) {
    uiState.floatingSize = size;
  }

  function handleMoveEnd(pos: { x: number; y: number }) {
    uiState.floatingPos = pos;
  }

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
      outline.model.items &&
      outline.model.uiState.expanded // 确保已完成展开
    ) {
      const scroll = untrack(() => outline.model.uiState?.scroll);

      if (scroll) {
        assert(listRef, 'no listRef');
        listElement.scrollLeft = scroll.x;
        listElement.scrollTop = scroll.y;
      }
    }
  });

  function scrollToFocused() {
    const key = viewer.editor.outline.expandToFocus();
    const item = key && listRef()?.querySelector(`[data-outline-item-key="${key}"]`);

    if (item) {
      item.scrollIntoView({ block: 'center' });
    }
  }

  function toggleFloating() {
    uiState.isFloating = !uiState.isFloating;
  }

  return (
    <FloatingPanel.Main
      isEnabled={Boolean(uiState.isFloating)}
      pos={floatingPos()}
      onMove={setFloatingPos}
      onMoveEnd={action(handleMoveEnd)}
    >
      <Resizable
        isEnabled={Boolean(uiState.isFloating)}
        className="absolute"
        size={floatingSize()}
        onResize={setFloatingSize}
        onResizeEnd={action(handleResizeEnd)}
      >
        <div
          class="overflow-auto border-r pb-4 flex flex-col"
          classList={{ 'overflow-auto h-full': !uiState.isFloating }}
          {...(uiState.isFloating
            ? { style: { width: `${floatingSize().width}px`, height: `${floatingSize().height}px` } }
            : splitter().getPanelProps({ id: props.id }))}
        >
          <FloatingPanel.Handler>
            <div class="top-0 bg-gray-50 flex">
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
          </FloatingPanel.Handler>
          <Show
            when={!outline.model.items || outline.model.items.length > 0}
            fallback={<div class="flex h-full justify-center items-center">无大纲</div>}
          >
            <div class="min-h-0 overflow-auto" ref={setListRef} onScrollEnd={action(handleScroll)}>
              <For
                each={outline.model.items}
                fallback={
                  <div class="flex h-full justify-center items-center overflow-hidden space-x-1">
                    <LoaderCircleIcon class="animate-spin" />
                    <span>加载中</span>
                  </div>
                }
              >
                {(item) => <Item outline={outline} onToggle={outline.model.toggleExpand} item={item} level={0} />}
              </For>
            </div>
          </Show>
        </div>
      </Resizable>
    </FloatingPanel.Main>
  );
}
