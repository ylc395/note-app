import { createMemo, For, JSX, Show } from 'solid-js';
import { Portal } from 'solid-js/web';
import { Menu, useMenu, type MenuSelectionDetails } from '@ark-ui/solid';

import shell from '#web/infra/shell';
import Item, { type MenuItem } from './Item';

export type { MenuItem } from './Item';

export default function ContextMenu<T = void>(props: {
  children: (props: JSX.HTMLAttributes<HTMLDivElement>) => JSX.Element;
  onOpenChange?: (e: { open: boolean }) => void;
  onItemClick?: (value: string) => void;
  topExtraContent?: (seed: T) => JSX.Element;
  seed: T;
  contextMenu?: Array<MenuItem | 'separator'> | ((data: T) => Array<MenuItem | 'separator'>);
}) {
  const onSelect = (e: MenuSelectionDetails) => props.onItemClick?.(e.value);

  const menu = useMenu({
    onOpenChange: props.onOpenChange,
    onSelect,
  });

  const items = createMemo(() =>
    typeof props.contextMenu === 'function' ? props.contextMenu?.(props.seed) : props.contextMenu,
  );

  const contentClassName = 'menu min-w-28 text-fg-secondary';

  return (
    <Show when={items()} fallback={props.children({})}>
      <Menu.RootProvider unmountOnExit lazyMount value={menu}>
        <Menu.ContextTrigger asChild={(childProps) => props.children(childProps())} />
        <Portal mount={shell.appRoot}>
          <Menu.Positioner onClick={(e) => e.stopPropagation()}>
            <Menu.Content class={contentClassName}>
              {props.topExtraContent?.(props.seed)}
              <For each={items()}>
                {(item) => <Item onMenuSelect={onSelect} item={item} menu={menu} contentClassName={contentClassName} />}
              </For>
            </Menu.Content>
          </Menu.Positioner>
        </Portal>
      </Menu.RootProvider>
    </Show>
  );
}
