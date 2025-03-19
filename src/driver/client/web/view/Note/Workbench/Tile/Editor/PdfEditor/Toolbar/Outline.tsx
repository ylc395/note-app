import { Menu, Collapsible } from '@ark-ui/solid';
import { ListIcon, ChevronRightIcon, ChevronDownIcon } from 'lucide-solid';
import { For, Show } from 'solid-js';

import type { OutlineItem } from '#domain/client/app/model/note/editor/PdfEditor/DocumentFactory';
import type PdfViewer from '../PDFViewer';

function Item(props: { item: OutlineItem; viewer: PdfViewer; level: number }) {
  function handleClick(e: MouseEvent) {
    e.stopPropagation();
    props.viewer.jumpTo(props.item.dest);
  }

  return (
    <Menu.Item value={props.item.key} style={{ 'padding-left': `${props.level * 20}px` }} onClick={handleClick}>
      <Show when={props.item.children.length > 0} fallback={<span class="pl-4">{props.item.title}</span>}>
        <Collapsible.Root lazyMount unmountOnExit>
          <Collapsible.Trigger class="group flex items-center" onClick={(e) => e.stopPropagation()}>
            <ChevronRightIcon class='group-data-[state="open"]:hidden w-4' />
            <ChevronDownIcon class='group-data-[state="closed"]:hidden w-4' />
            {props.item.title}
          </Collapsible.Trigger>
          <Collapsible.Content>
            <Menu.Content>
              <For each={props.item.children}>
                {(item) => <Item item={item} viewer={props.viewer} level={props.level + 1} />}
              </For>
            </Menu.Content>
          </Collapsible.Content>
        </Collapsible.Root>
      </Show>
    </Menu.Item>
  );
}

export default function Outline(props: { viewer: PdfViewer }) {
  return (
    <Menu.Root lazyMount unmountOnExit>
      <Menu.Trigger>
        <ListIcon />
      </Menu.Trigger>
      <Menu.Positioner>
        <Menu.Content class="z-10 cursor-pointer bg-white max-h-64 overflow-auto">
          <For each={props.viewer.editor.outlines}>
            {(outline) => <Item viewer={props.viewer} item={outline} level={0} />}
          </For>
        </Menu.Content>
      </Menu.Positioner>
    </Menu.Root>
  );
}
