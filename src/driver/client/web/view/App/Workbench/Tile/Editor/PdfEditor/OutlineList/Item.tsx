import { Collapsible, Tooltip } from '@ark-ui/solid';
import { ChevronRightIcon, ChevronDownIcon } from 'lucide-solid';
import { createMemo, For, Show } from 'solid-js';

import type { OutlineItem } from '#domain/client/app/model/Workbench/noteEditor/PdfEditor';
import type Outline from './Outline';

function Title(props: { item: OutlineItem; outline: Outline; isFocused: boolean; class?: string }) {
  const annotationCount = createMemo(() => props.outline.model.getAnnotationCount(props.item.key));
  const pageRange = props.outline.model.getPageRange(props.item.key);

  function handleClick(e: MouseEvent) {
    e.stopPropagation();

    if (props.item.dest) {
      props.outline.jumpTo(props.item);
    }
  }

  return (
    <>
      <Tooltip.Root positioning={{ placement: 'right' }}>
        <Tooltip.Trigger
          asChild={(childProps) => (
            <span
              {...childProps}
              data-outline-item-key={props.item.key}
              onClick={handleClick}
              class={props.class}
              classList={{ 'font-bold': props.isFocused }}
            >
              {props.item.title}
            </span>
          )}
        />
        <Show when={pageRange}>
          {(value) => (
            <Tooltip.Positioner class="bg-bg-tertiary">
              <Tooltip.Content>
                {value()[0]} - {value()[1]}
              </Tooltip.Content>
            </Tooltip.Positioner>
          )}
        </Show>
      </Tooltip.Root>
      <Show when={annotationCount() > 0}>
        <span>{annotationCount()}</span>
      </Show>
    </>
  );
}

export default function Item(props: {
  item: OutlineItem;
  outline: Outline;
  level: number;
  onToggle: (e: { key: string; value: boolean }) => void;
}) {
  const isFocused = createMemo(() => {
    return props.outline.model.focusedKey === props.item.key;
  });

  return (
    <div classList={{ 'mb-1': props.item.children.length === 0 }} style={{ 'padding-left': `${props.level * 20}px` }}>
      <Show
        when={props.item.children.length > 0}
        fallback={
          <Title isFocused={isFocused()} outline={props.outline} item={props.item} class="pl-4 cursor-pointer" />
        }
      >
        <Collapsible.Root
          open={props.outline.model.uiState.expanded?.has(props.item.key)}
          lazyMount
          unmountOnExit
          onOpenChange={({ open }) => props.onToggle({ key: props.item.key, value: open })}
        >
          <div class="flex mb-1 cursor-pointer">
            <Collapsible.Trigger class="group flex items-center">
              <ChevronRightIcon class='group-data-[state="open"]:hidden w-4' />
              <ChevronDownIcon class='group-data-[state="closed"]:hidden w-4' />
            </Collapsible.Trigger>
            <Title isFocused={isFocused()} outline={props.outline} item={props.item} />
          </div>
          <Collapsible.Content>
            <For each={props.item.children}>
              {(item) => <Item outline={props.outline} item={item} level={props.level + 1} onToggle={props.onToggle} />}
            </For>
          </Collapsible.Content>
        </Collapsible.Root>
      </Show>
    </div>
  );
}
