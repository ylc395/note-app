import { For, Show } from 'solid-js';
import { BookTextIcon, ChevronRightIcon, NetworkIcon } from 'lucide-solid';
import { Popover } from '@ark-ui/solid';

import Button from '#web/view/components/Button';
import { useContext } from './composables';
import LinkList from './LinkList';

export default function Breadcrumbs() {
  const itemClassName = 'text-fg-secondary flex items-center shrink-0 text-sm';
  const iconClassName = 'w-4 h-4 text-fg-secondary';
  const ctx = useContext()!;

  return (
    <div class="flex px-4 py-2 border-b border-border-secondary overflow-auto shrink-0 justify-between">
      <div class="flex">
        <Show when={ctx.editor.source.path.result.data && ctx.editor.source.value.result.data}>
          <div class={itemClassName}>
            <BookTextIcon class={iconClassName} />
            <ChevronRightIcon class={iconClassName} />
          </div>
          <For each={ctx.editor.source.path.result.data}>
            {(path) => (
              <div class={itemClassName}>
                {path.title}
                <ChevronRightIcon class={iconClassName} />
              </div>
            )}
          </For>
          <div class={`${itemClassName} italic`}>此笔记</div>
        </Show>
      </div>
      <Show when={ctx.editor.source.value.result.data}>
        <Popover.Root lazyMount unmountOnExit closeOnInteractOutside={false}>
          <Popover.Trigger
            asChild={(props) => (
              <Button size="small" {...props()}>
                <NetworkIcon /> 关联内容
              </Button>
            )}
          />
          <Popover.Positioner class="z-10!">
            <LinkList />
          </Popover.Positioner>
        </Popover.Root>
      </Show>
    </div>
  );
}
