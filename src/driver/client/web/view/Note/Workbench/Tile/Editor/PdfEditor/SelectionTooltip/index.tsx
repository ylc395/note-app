import { For, onCleanup, onMount, Show } from 'solid-js';
import { ChevronDown, MessageSquareMoreIcon, PaintbrushIcon } from 'lucide-solid';
import { Menu } from '@ark-ui/solid';

import SelectionModel from './Selection';
import CommentInput from './CommentInput';

export default function SelectionTooltip(props: { selection: SelectionModel }) {
  let rootEl: HTMLDivElement | undefined;

  onMount(() => {
    props.selection.init(rootEl!);

    onCleanup(() => {
      props.selection.dispose();
    });
  });

  return (
    <div ref={rootEl} class="absolute">
      <Show when={props.selection.isVisible}>
        <div class="flex space-x-2 bg-white py-2 px-1 rounded shadow-md z-50">
          <Menu.Root
            lazyMount
            unmountOnExit
            positioning={{ placement: 'bottom' }}
            onSelect={(e) => props.selection.setColor(e.value)}
          >
            <Menu.Trigger>
              <button class="flex">
                <span class="w-4 h-4 border" style={{ 'background-color': props.selection.color }}></span>
                <ChevronDown />
              </button>
            </Menu.Trigger>
            <Menu.Positioner>
              <Menu.Content class="flex border">
                <For each={['yellow', 'red', 'blue', 'green']}>
                  {(color) => (
                    <Menu.Item
                      class="w-4 h-4 cursor-pointer border"
                      value={color}
                      style={{ 'background-color': color }}
                    />
                  )}
                </For>
              </Menu.Content>
            </Menu.Positioner>
          </Menu.Root>
          <button class="flex items-center" onClick={() => props.selection.highlight()}>
            <PaintbrushIcon />
          </button>
          <button onClick={() => props.selection.initCommentEditor()} class="flex items-center">
            <MessageSquareMoreIcon />
          </button>
        </div>
      </Show>
      <Show when={props.selection.commentEditor}>
        <CommentInput selection={props.selection} />
      </Show>
    </div>
  );
}
