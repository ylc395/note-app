import { Collapsible } from '@ark-ui/solid';
import { ChevronRightIcon, ChevronDownIcon } from 'lucide-solid';
import { For, Show } from 'solid-js';
import { pull } from 'lodash-es';

import type { OutlineItem } from '#domain/client/app/model/note/editor/PdfEditor/DocumentFactory';
import type PdfViewer from './PDFViewer';
import { action } from 'mobx';

function Item(props: {
  item: OutlineItem;
  viewer: PdfViewer;
  level: number;
  onToggle: (e: { key: string; value: boolean }) => void;
}) {
  function handleClick(e: MouseEvent) {
    e.stopPropagation();
    props.viewer.jumpTo(props.item.dest);
  }

  return (
    <div classList={{ 'mb-1': props.item.children.length === 0 }} style={{ 'padding-left': `${props.level * 20}px` }}>
      <Show
        when={props.item.children.length > 0}
        fallback={
          <span onClick={handleClick} class="pl-4 cursor-pointer">
            {props.item.title}
          </span>
        }
      >
        <Collapsible.Root
          open={props.viewer.editor.uiState.expandedOutlineItems?.includes(props.item.key)}
          lazyMount
          unmountOnExit
          onOpenChange={({ open }) => props.onToggle({ key: props.item.key, value: open })}
        >
          <div class="flex mb-1 cursor-pointer">
            <Collapsible.Trigger class="group flex items-center">
              <ChevronRightIcon class='group-data-[state="open"]:hidden w-4' />
              <ChevronDownIcon class='group-data-[state="closed"]:hidden w-4' />
            </Collapsible.Trigger>
            <span onClick={handleClick}>{props.item.title}</span>
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
  function onToggle({ key, value }: { key: string; value: boolean }) {
    if (!props.viewer.editor.uiState.expandedOutlineItems) {
      props.viewer.editor.uiState.expandedOutlineItems = [];
    }

    if (value) {
      props.viewer.editor.uiState.expandedOutlineItems.push(key);
    } else {
      pull(props.viewer.editor.uiState.expandedOutlineItems, key);
    }
  }

  return (
    <div class="w-64 overflow-auto h-full border-r pb-12">
      <For each={props.viewer.editor.outlines}>
        {(outline) => <Item onToggle={action(onToggle)} viewer={props.viewer} item={outline} level={0} />}
      </For>
    </div>
  );
}
