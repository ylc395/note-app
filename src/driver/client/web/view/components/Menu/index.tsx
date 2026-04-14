import { createEffect, createMemo, For, JSX, onCleanup, Show, type Ref } from 'solid-js';
import { Portal } from 'solid-js/web';
import {
  Menu as ArkMenu,
  useMenu,
  type MenuSelectionDetails,
  type UseMenuProps,
  type UseMenuReturn,
} from '@ark-ui/solid';

import shell from '#web/infra/shell';
import Item, { type MenuItem } from './Item';

export type { MenuItem } from './Item';

const menuGroupMap = new Map<symbol, UseMenuReturn>();

export default function Menu<T = void>(props: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  children?: (props: JSX.HTMLAttributes<any>) => JSX.Element;
  onOpenChange?: (e: { open: boolean }) => void;
  onSelect?: (value: string) => void;
  topContent?: (seed?: T) => JSX.Element;
  dataForItems: T;
  menu?: Array<MenuItem | 'separator'> | ((data: T) => Array<MenuItem | 'separator'>);
  contextmenu?: boolean;
  positioning?: UseMenuProps['positioning'];
  open?: boolean;
  ref?: Ref<HTMLDivElement>;
  menuGroupKey?: symbol;
}) {
  const menu = useMenu({
    onOpenChange: props.onOpenChange,
    onSelect,
    positioning: !props.contextmenu ? props.positioning ?? { placement: 'bottom-start' } : undefined,
    open: props.open,
    loopFocus: true,
  });

  const items = createMemo(() => (typeof props.menu === 'function' ? props.menu?.(props.dataForItems) : props.menu));
  const contentClassName = 'min-w-28 rounded-md border border-border-primary bg-surface-raised p-1 shadow-lg';

  createEffect(() => {
    if (!props.menuGroupKey) {
      return;
    }

    const currentMenu = menuGroupMap.get(props.menuGroupKey);

    if (menu.api().open) {
      if (currentMenu !== menu) {
        currentMenu?.api().setOpen(false);
        menuGroupMap.set(props.menuGroupKey, menu);
      }
    }

    onCleanup(() => {
      if (props.menuGroupKey && currentMenu === menu) {
        menuGroupMap.delete(props.menuGroupKey);
      }
    });
  });

  function renderMenuContent() {
    return (
      <ArkMenu.Content ref={props.ref} class={contentClassName}>
        {props.topContent?.(props.dataForItems)}
        <For each={items()}>
          {(item) => <Item onMenuSelect={onSelect} item={item} menu={menu} contentClassName={contentClassName} />}
        </For>
      </ArkMenu.Content>
    );
  }

  function onSelect(e: MenuSelectionDetails) {
    props.onSelect?.(e.value);
  }

  return (
    <Show when={items()} fallback={props.children?.({})}>
      <ArkMenu.RootProvider unmountOnExit lazyMount value={menu}>
        <Show when={props.children}>
          <Show
            when={props.contextmenu}
            fallback={<ArkMenu.Trigger asChild={(childProps) => props.children!(childProps())} />}
          >
            <ArkMenu.ContextTrigger asChild={(childProps) => props.children!(childProps())} />
          </Show>
        </Show>
        <Portal mount={shell.appRoot}>
          <Show when={props.children} fallback={renderMenuContent()}>
            <ArkMenu.Positioner onClick={(e) => e.stopPropagation()}>{renderMenuContent()}</ArkMenu.Positioner>
          </Show>
        </Portal>
      </ArkMenu.RootProvider>
    </Show>
  );
}
