import { createEffect, createSignal, For, onCleanup, Show, untrack } from 'solid-js';
import { LoaderCircleIcon, EyeIcon, PinOffIcon } from 'lucide-solid';
import assert from 'assert';
import { action } from 'mobx';
import { useSplitterContext } from '@ark-ui/solid';
import { partialRight } from 'lodash-es';
import { cx } from 'class-variance-authority';

import Item from './Item';
import OutlineViewModel from './Outline';
import { useContext } from '../context';
import Button from '#web/view/components/Button';
import FloatingPanel from '#web/view/components/FloatingPanel';

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

  function handleMove(pos: { x: number; y: number }, start?: boolean) {
    if (start) {
      uiState.isFloating = true;
    }
    setFloatingPos(pos);
  }

  function cancelFloating() {
    uiState.isFloating = false;
  }

  return (
    <FloatingPanel.Main
      isEnabled={Boolean(uiState.isFloating)}
      pos={floatingPos()}
      onMove={action(handleMove)}
      onMoveStart={action(partialRight(handleMove, true))}
      onMoveEnd={action(handleMoveEnd)}
      size={floatingSize()}
      onResize={action(setFloatingSize)}
      onResizeEnd={action(handleResizeEnd)}
      boundaryEl={() => viewer.rootEl}
      asChild={(injected) => (
        <div
          class={cx(
            'overflow-auto border-border-primary flex flex-col bg-surface-raised relative h-full',
            uiState.isFloating ? 'border' : 'border-r',
          )}
          {...injected()}
          {...(uiState.isFloating ? null : splitter().getPanelProps({ id: props.id }))}
        >
          <FloatingPanel.Handler
            asChild={(props) => (
              <div {...props()} class="top-0 bg-bg-secondary flex items-center">
                <h4>大纲</h4>
                <div class="flex items-center justify-end grow">
                  <Button size="small" onClick={scrollToFocused}>
                    <EyeIcon class="mr-1" />
                    当前浏览
                  </Button>
                  <Show when={uiState.isFloating}>
                    <Button size="small" onClick={action(cancelFloating)}>
                      <PinOffIcon class="mr-1" />
                      取消悬浮
                    </Button>
                  </Show>
                </div>
              </div>
            )}
          />
          <Show
            when={!outline.model.items || outline.model.items.length > 0}
            fallback={<div class="flex h-full justify-center items-center">无大纲</div>}
          >
            <div class="grow p-4 overflow-auto" ref={setListRef} onScrollEnd={action(handleScroll)}>
              <For
                each={outline.model.items}
                fallback={
                  <div class="flex h-full justify-center items-center">
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
      )}
    />
  );
}
