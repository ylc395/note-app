import { For } from 'solid-js';
import { Menu } from '@ark-ui/solid';
import { ChevronDown } from 'lucide-solid';

import Button from '#web/view/components/Button';
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
        <Button square size="md" class="gap-0.5">
          <span
            class="w-4 h-4 rounded-sm border border-border-primary"
            style={{ 'background-color': props.selection.color }}
          />
          <ChevronDown class="size-3 text-fg-tertiary" />
        </Button>
      </Menu.Trigger>
      <Menu.Positioner>
        <Menu.Content class="flex gap-1 bg-surface-raised border border-border-primary rounded-lg shadow-lg p-1.5">
          <For each={['yellow', 'red', 'blue', 'green']}>
            {(color) => (
              <Menu.Item
                value={color}
                class="w-5 h-5 rounded-sm cursor-pointer border border-border-primary hover:scale-110 transition-transform"
                style={{ 'background-color': color }}
              />
            )}
          </For>
        </Menu.Content>
      </Menu.Positioner>
    </Menu.Root>
  );
}
