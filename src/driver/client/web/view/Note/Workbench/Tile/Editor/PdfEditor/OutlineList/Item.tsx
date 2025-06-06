import { Collapsible, Tooltip } from '@ark-ui/solid';
import { ChevronRightIcon, ChevronDownIcon } from 'lucide-solid';
import { createMemo, For, Show } from 'solid-js';

import type { OutlineItem } from '#domain/client/app/model/note/editor/PdfEditor';
import type PdfViewer from '../PDFViewer';

function Title(props: { item: OutlineItem; viewer: PdfViewer; class?: string }) {
  const isFocused = createMemo(
    () =>
      !props.viewer.editor.outline.state.get('expanded').includes(props.item.key) &&
      props.viewer.editor.outline.focusedPath?.includes(props.item.key),
  );
  const annotationCount = createMemo(() => props.viewer.editor.outline.getAnnotationCount(props.item.key));
  const pageRange = props.viewer.editor.outline.getPageRange(props.item.key);

  function handleClick(e: MouseEvent) {
    e.stopPropagation();

    if (props.item.dest) {
      props.viewer.jumpTo(props.item);
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
              classList={{ 'font-bold': isFocused() }}
            >
              {props.item.title}
            </span>
          )}
        />
        <Show when={pageRange}>
          {(value) => (
            <Tooltip.Positioner class="bg-gray-200">
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
  viewer: PdfViewer;
  level: number;
  onToggle: (e: { key: string; value: boolean }) => void;
}) {
  return (
    <div classList={{ 'mb-1': props.item.children.length === 0 }} style={{ 'padding-left': `${props.level * 20}px` }}>
      <Show
        when={props.item.children.length > 0}
        fallback={<Title viewer={props.viewer} item={props.item} class="pl-4 cursor-pointer" />}
      >
        <Collapsible.Root
          open={props.viewer.editor.outline.state.get('expanded').includes(props.item.key)}
          lazyMount
          unmountOnExit
          onOpenChange={({ open }) => props.onToggle({ key: props.item.key, value: open })}
        >
          <div class="flex mb-1 cursor-pointer">
            <Collapsible.Trigger class="group flex items-center">
              <ChevronRightIcon class='group-data-[state="open"]:hidden w-4' />
              <ChevronDownIcon class='group-data-[state="closed"]:hidden w-4' />
            </Collapsible.Trigger>
            <Title viewer={props.viewer} item={props.item} />
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
