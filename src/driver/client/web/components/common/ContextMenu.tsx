import { createMemo, For, JSX, Show } from 'solid-js';
import { Portal } from 'solid-js/web';
import { Menu } from '@ark-ui/solid';

import shell from '#web/infra/shell';

export default function ContextMenu<T = void>(props: {
  children: (props: JSX.HTMLAttributes<HTMLDivElement>) => JSX.Element;
  onOpenChange?: (e: { open: boolean }) => void;
  onItemClick?: (value: string) => void;
  topExtraContent?: (seed: T) => JSX.Element;
  seed: T;
  contextMenu?: (
    data: T,
  ) => Array<{ label: string; key: string; className?: string; disabled?: boolean } | 'separator'>;
}) {
  const items = createMemo(() => props.contextMenu?.(props.seed));

  return (
    <Show when={items()} fallback={props.children({})}>
      <Menu.Root
        unmountOnExit
        lazyMount
        onOpenChange={props.onOpenChange}
        onSelect={(e) => props.onItemClick?.(e.value)}
      >
        <Menu.ContextTrigger asChild={(childProps) => props.children(childProps())} />
        <Portal mount={shell.appRoot}>
          <Menu.Positioner onClick={(e) => e.stopPropagation()}>
            <Menu.Content class="menu min-w-28 text-text-secondary">
              {props.topExtraContent?.(props.seed)}
              <For each={items()}>
                {(item) => {
                  return item === 'separator' ? (
                    <Menu.Separator />
                  ) : (
                    <Menu.Item disabled={item.disabled} class={`menu-item ${item.className || ''}`} value={item.key}>
                      {item.label}
                    </Menu.Item>
                  );
                }}
              </For>
            </Menu.Content>
          </Menu.Positioner>
        </Portal>
      </Menu.Root>
    </Show>
  );
}
