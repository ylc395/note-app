import { Collapsible } from '@ark-ui/solid';
import { ChevronRightIcon, ChevronDownIcon, Loader2Icon } from 'lucide-solid';
import { createEffect, createMemo, For, on, Show } from 'solid-js';
import { pull } from 'lodash-es';
import { action } from 'mobx';
import assert from 'assert';

import type { OutlineItem } from '#domain/client/app/model/note/editor/PdfEditor';
import type PdfViewer from './PDFViewer';

function Item(props: {
  item: OutlineItem;
  viewer: PdfViewer;
  level: number;
  onToggle: (e: { key: string; value: boolean }) => void;
}) {
  function handleClick(e: MouseEvent) {
    e.stopPropagation();

    if (props.item.dest) {
      props.viewer.jumpTo(props.item);
    }
  }

  const isFocused = createMemo(() => props.item.key === props.viewer.editor.outline.focusedItemKey);

  return (
    <div classList={{ 'mb-1': props.item.children.length === 0 }} style={{ 'padding-left': `${props.level * 20}px` }}>
      <Show
        when={props.item.children.length > 0}
        fallback={
          <span onClick={handleClick} class="pl-4 cursor-pointer" classList={{ 'font-bold': isFocused() }}>
            {props.item.title}
          </span>
        }
      >
        <Collapsible.Root
          open={props.viewer.editor.uiState?.['outline.expanded']?.includes(props.item.key)}
          lazyMount
          unmountOnExit
          onOpenChange={({ open }) => props.onToggle({ key: props.item.key, value: open })}
        >
          <div class="flex mb-1 cursor-pointer">
            <Collapsible.Trigger class="group flex items-center">
              <ChevronRightIcon class='group-data-[state="open"]:hidden w-4' />
              <ChevronDownIcon class='group-data-[state="closed"]:hidden w-4' />
            </Collapsible.Trigger>
            <span classList={{ 'font-bold': isFocused() }} onClick={handleClick}>
              {props.item.title}
            </span>
          </div>
          <Collapsible.Content>
            <For each={props.item.children}>
              {(item) => <Item item={item} viewer={props.viewer} level={props.level + 1} onToggle={props.onToggle} />}
            </For>
          </Collapsible.Content>
        </Collapsible.Root>
      </Show>
    </div>
  );
}

export default function Outline(props: { viewer: PdfViewer }) {
  let listRef: HTMLDivElement | undefined;

  function onToggle({ key, value }: { key: string; value: boolean }) {
    assert(props.viewer.editor.uiState);

    if (!props.viewer.editor.uiState['outline.expanded']) {
      props.viewer.editor.uiState['outline.expanded'] = [];
    }

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

  return (
    <div class="w-64 overflow-auto h-full border-r pb-12" ref={listRef} onScrollEnd={action(handleScroll)}>
      <Show
        when={props.viewer.editor.outline.items?.length === 0}
        fallback={
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
        }
      >
        <div class="flex h-full justify-center items-center">无大纲</div>
      </Show>
    </div>
  );
}
