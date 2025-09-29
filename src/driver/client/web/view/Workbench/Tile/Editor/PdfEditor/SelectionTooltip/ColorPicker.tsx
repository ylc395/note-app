import { For } from 'solid-js';
import { Menu } from '@ark-ui/solid';
import { ChevronDown } from 'lucide-solid';

import type Selection from './Selection';

export default function ColorPicker(props: { selection: Selection }) {
  return (
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
              <Menu.Item class="w-4 h-4 cursor-pointer border" value={color} style={{ 'background-color': color }} />
            )}
          </For>
        </Menu.Content>
      </Menu.Positioner>
    </Menu.Root>
  );
}
