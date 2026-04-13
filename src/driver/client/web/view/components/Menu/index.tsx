import { createMemo, For, JSX, Show } from 'solid-js';
import { Portal } from 'solid-js/web';
import { Menu as ArkMenu, useMenu, type MenuSelectionDetails } from '@ark-ui/solid';

import shell from '#web/infra/shell';
import Item, { type MenuItem } from './Item';

export type { MenuItem } from './Item';

export default function Menu<T = void>(props: {
  children: (props: JSX.HTMLAttributes<HTMLDivElement>) => JSX.Element;
  onOpenChange?: (e: { open: boolean }) => void;
  onSelect?: (value: string) => void;
  topContent?: (seed: T) => JSX.Element;
  dataForItems: T;
  menu?: Array<MenuItem | 'separator'> | ((data: T) => Array<MenuItem | 'separator'>);
  contextmenu?: boolean;
  positioning?: Record<string, unknown>;
}) {
  const onSelect = (e: MenuSelectionDetails) => props.onSelect?.(e.value);

  const menu = useMenu({
    onOpenChange: props.onOpenChange,
    onSelect,
    positioning: !props.contextmenu ? props.positioning ?? { placement: 'bottom-start' } : undefined,
  });

  const items = createMemo(() => (typeof props.menu === 'function' ? props.menu?.(props.dataForItems) : props.menu));
  const contentClassName = 'min-w-28 rounded-md border border-border-primary bg-surface-raised p-1 shadow-lg';

  return (
    <Show when={items()} fallback={props.children({})}>
      <ArkMenu.RootProvider unmountOnExit lazyMount value={menu}>
        <Show
          when={props.contextmenu}
          fallback={<ArkMenu.Trigger asChild={(childProps) => props.children(childProps())} />}
        >
          <ArkMenu.ContextTrigger asChild={(childProps) => props.children(childProps())} />
        </Show>
        <Portal mount={shell.appRoot}>
          <ArkMenu.Positioner onClick={(e) => e.stopPropagation()}>
            <ArkMenu.Content class={contentClassName}>
              {props.topContent?.(props.dataForItems)}
              <For each={items()}>
                {(item) => <Item onMenuSelect={onSelect} item={item} menu={menu} contentClassName={contentClassName} />}
              </For>
            </ArkMenu.Content>
          </ArkMenu.Positioner>
        </Portal>
      </ArkMenu.RootProvider>
    </Show>
  );
}
