import { For, Show } from 'solid-js';
import { BookTextIcon, ChevronRightIcon, InfoIcon, NetworkIcon } from 'lucide-solid';
import { Popover } from '@ark-ui/solid';

import Button from '#web/view/components/Button';
import { useContext } from '../composables';
import LinkList from './LinkList';
import Info from './Info';

export default function Meta() {
  const itemClassName = 'text-fg-secondary flex items-center shrink-0 text-sm';
  const iconClassName = 'w-4 h-4 text-fg-secondary';
  const ctx = useContext()!;
  const contentClassName =
    'bg-surface-raised rounded-lg shadow-lg border border-border-primary min-w-[240px] max-w-[360px] max-h-[480px] overflow-y-auto z-10!';

  return (
    <Show when={ctx.editor.entity.value.result.data}>
      <div class="flex px-4 py-2 border-b border-border-secondary overflow-auto shrink-0 justify-between">
        <div class="flex">
          <Show when={ctx.editor.entity.path.result.data}>
            <div class={itemClassName}>
              <BookTextIcon class={iconClassName} />
              <ChevronRightIcon class={iconClassName} />
            </div>
            <For each={ctx.editor.entity.path.result.data}>
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
        <Show when={ctx.editor.entity.value.result.data}>
          <div class="flex">
            <Popover.Root lazyMount unmountOnExit closeOnInteractOutside={false}>
              <Popover.Trigger
                asChild={(props) => (
                  <Button size="small" {...props()}>
                    <InfoIcon /> 更多信息
                  </Button>
                )}
              />
              <Popover.Positioner class={contentClassName}>
                <Info />
              </Popover.Positioner>
            </Popover.Root>
            <Popover.Root lazyMount unmountOnExit closeOnInteractOutside={false}>
              <Popover.Trigger
                asChild={(props) => (
                  <Button size="small" {...props()}>
                    <NetworkIcon /> 关联内容
                  </Button>
                )}
              />
              <Popover.Positioner class={contentClassName}>
                <LinkList />
              </Popover.Positioner>
            </Popover.Root>
          </div>
        </Show>
      </div>
    </Show>
  );
}
