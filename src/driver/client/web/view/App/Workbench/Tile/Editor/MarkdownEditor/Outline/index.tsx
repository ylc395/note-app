import assert from 'assert';
import { createMemo, createSignal, For, onCleanup, Show, type Accessor } from 'solid-js';
import { Collapsible, useSplitterContext } from '@ark-ui/solid';
import { ChevronDownIcon, ChevronRightIcon, HeadingIcon, LoaderCircleIcon, PinOffIcon } from 'lucide-solid';
import { isEqual, partialRight } from 'lodash-es';
import { cx } from 'class-variance-authority';
import { action } from 'mobx';

import MarkdownEditor from '#domain/client/app/model/Workbench/noteEditor/MarkdownEditor';
import type { TocItem } from '#domain/client/app/model/Workbench/noteEditor/BaseEditor';
import type Editor from '#web/view/components/MarkdownEditor/Editor';
import FloatingPanel from '#web/view/components/FloatingPanel';
import Button from '#web/view/components/Button';

import { useContext } from '../../composables';
import OutlineController from './Outline';

function TocNode(props: { item: TocItem; outline: OutlineController }) {
  const hasChildren = createMemo(() => !!props.item.children?.length);
  const indent = createMemo(() => (props.item.depth - 1) * 20);
  const isCurrent = createMemo(() => isEqual(props.outline.currentHeadingPosition, props.item.position));

  function handleClick() {
    props.outline.scrollIntoHeading(props.item.position);
  }

  return (
    <div style={{ 'padding-left': `${indent()}px` }}>
      <Show
        when={hasChildren()}
        fallback={
          <span onClick={handleClick} class={cx('pl-4 cursor-pointer', isCurrent() && 'font-semibold')}>
            {props.item.text}
          </span>
        }
      >
        <Collapsible.Root defaultOpen={true} lazyMount unmountOnExit>
          <div class="flex mb-1 cursor-pointer">
            <Collapsible.Trigger class="group flex items-center">
              <ChevronRightIcon class='group-data-[state="open"]:hidden w-4' />
              <ChevronDownIcon class='group-data-[state="closed"]:hidden w-4' />
            </Collapsible.Trigger>
            <span onClick={handleClick} class={cx(isCurrent() && 'font-semibold')}>
              {props.item.text}
            </span>
          </div>
          <Collapsible.Content>
            <For each={props.item.children}>{(child) => <TocNode item={child} outline={props.outline} />}</For>
          </Collapsible.Content>
        </Collapsible.Root>
      </Show>
    </div>
  );
}

export default function Outline(props: {
  editorViewModel: Editor;
  floatingBoundary: Accessor<HTMLElement | null>;
  id: string;
}) {
  const { editor } = useContext()!;

  assert(editor instanceof MarkdownEditor);
  const isEmpty = createMemo(() => editor.toc?.length === 0);
  const uiState = editor.uiState!.outline;
  const splitter = useSplitterContext();

  const [floatingSize, setFloatingSize] = createSignal(uiState.floatingSize || { width: 300, height: 500 });
  const [floatingPos, setFloatingPos] = createSignal(uiState.floatingPos || { x: 20, y: 20 });

  const outline = new OutlineController(props.editorViewModel);
  onCleanup(() => outline.destroy());

  function handleResizeEnd(size: { width: number; height: number }) {
    uiState.floatingSize = size;
  }

  function handleMoveEnd(pos: { x: number; y: number }) {
    uiState.floatingPos = pos;
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
      boundaryEl={props.floatingBoundary}
      asChild={(injected) => (
        <div
          class={cx(
            'border-border-primary flex flex-col bg-surface-raised relative h-full',
            uiState.isFloating ? 'border' : 'border-r',
          )}
          {...injected()}
          {...(uiState.isFloating ? null : splitter().getPanelProps({ id: props.id }))}
        >
          <FloatingPanel.Handler
            asChild={(handlerProps) => (
              <div {...handlerProps()} class="top-0 bg-bg-secondary flex items-center px-2 py-1">
                <h4 class="text-sm font-medium">大纲</h4>
                <div class="flex items-center justify-end grow">
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
            when={!isEmpty()}
            fallback={
              <div class="flex flex-col items-center justify-center h-full text-fg-tertiary gap-2 p-4">
                <HeadingIcon class="w-8 h-8 opacity-30" />
                <span class="text-sm">添加标题即可生成大纲</span>
              </div>
            }
          >
            <div class="h-full overflow-auto p-1">
              <For
                each={editor.toc}
                fallback={
                  <div class="flex h-full justify-center items-center">
                    <LoaderCircleIcon class="animate-spin" />
                    <span>加载中</span>
                  </div>
                }
              >
                {(item) => <TocNode item={item} outline={outline} />}
              </For>
            </div>
          </Show>
        </div>
      )}
    />
  );
}
