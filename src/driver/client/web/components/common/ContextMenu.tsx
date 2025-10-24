import { createMemo, For, JSX, Show } from 'solid-js';
import { Portal } from 'solid-js/web';
import { Menu, useMenu } from '@ark-ui/solid';
import { ChevronRightIcon } from 'lucide-solid';

import shell from '#web/infra/shell';

export interface MenuItem {
  label: string;
  key: string;
  className?: string;
  disabled?: boolean;
  content?: (e: { closeMenu: () => void }) => JSX.Element;
}

export default function ContextMenu<T = void>(props: {
  children: (props: JSX.HTMLAttributes<HTMLDivElement>) => JSX.Element;
  onOpenChange?: (e: { open: boolean }) => void;
  onItemClick?: (value: string) => void;
  topExtraContent?: (seed: T) => JSX.Element;
  seed: T;
  contextMenu?: Array<MenuItem | 'separator'> | ((data: T) => Array<MenuItem | 'separator'>);
}) {
  const menu = useMenu({
    onOpenChange: props.onOpenChange,
    onSelect: (e) => props.onItemClick?.(e.value),
  });

  const items = createMemo(() =>
    typeof props.contextMenu === 'function' ? props.contextMenu?.(props.seed) : props.contextMenu,
  );

  function closeMenu() {
    menu.api().setOpen(false);
  }

  return (
    <Show when={items()} fallback={props.children({})}>
      <Menu.RootProvider unmountOnExit lazyMount value={menu}>
        <Menu.ContextTrigger asChild={(childProps) => props.children(childProps())} />
        <Portal mount={shell.appRoot}>
          <Menu.Positioner onClick={(e) => e.stopPropagation()}>
            <Menu.Content class="menu min-w-28 text-text-secondary">
              {props.topExtraContent?.(props.seed)}
              <For each={items()}>
                {(item) => {
                  return item === 'separator' ? (
                    <Menu.Separator />
                  ) : item.content ? (
                    <Menu.Root lazyMount unmountOnExit>
                      <Menu.TriggerItem class={`menu-item ${item.className}`}>
                        <span class="grow">{item.label}</span>
                        <Menu.Indicator>
                          <ChevronRightIcon />
                        </Menu.Indicator>
                      </Menu.TriggerItem>
                      <Menu.Positioner>
                        <Menu.Content>{item.content({ closeMenu })}</Menu.Content>
                      </Menu.Positioner>
                    </Menu.Root>
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
      </Menu.RootProvider>
    </Show>
  );
}
