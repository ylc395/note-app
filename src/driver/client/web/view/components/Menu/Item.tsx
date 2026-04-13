import { Menu, type MenuSelectionDetails, type UseMenuReturn } from '@ark-ui/solid';
import { ChevronRightIcon } from 'lucide-solid';
import type { JSX } from 'solid-js';

export interface MenuItem {
  icon?: () => JSX.Element;
  label: string;
  key: string;
  className?: string;
  disabled?: boolean;
  children?: Array<MenuItem | 'separator'>;
  content?: (e: { closeMenu: () => void }) => JSX.Element;
}

// 这个组件没有响应性
export default function Item(props: {
  item: MenuItem | 'separator';
  onMenuSelect: (e: MenuSelectionDetails) => void;
  menu: UseMenuReturn;
  contentClassName?: string;
}) {
  function closeMenu() {
    props.menu.api().setOpen(false);
  }

  if (props.item === 'separator') {
    // 分割线
    return <Menu.Separator class="-mx-1 my-1 h-px border-0 bg-border-secondary" />;
  }

  const itemClassName =
    `flex cursor-default items-center rounded-sm px-2 py-1.5 text-sm text-fg-primary data-[highlighted]:bg-bg-hover data-[disabled]:text-fg-disabled ${
      props.item.className || ''
    }`.trim();

  if (!props.item.children && !props.item.content) {
    // 简单的菜单项
    return (
      <Menu.Item disabled={props.item.disabled} class={itemClassName} value={props.item.key}>
        {props.item.icon?.()}
        {props.item.label}
      </Menu.Item>
    );
  }

  // 子菜单
  return (
    <Menu.Root lazyMount unmountOnExit onSelect={props.onMenuSelect}>
      <Menu.TriggerItem class={itemClassName}>
        <span class="grow">{props.item.label}</span>
        <Menu.Indicator>
          <ChevronRightIcon class="size-4" />
        </Menu.Indicator>
      </Menu.TriggerItem>
      <Menu.Positioner>
        <Menu.Content class={props.contentClassName}>
          {props.item.content?.({ closeMenu }) ||
            props.item.children?.map((child) => (
              <Item onMenuSelect={props.onMenuSelect} item={child} menu={props.menu} />
            ))}
        </Menu.Content>
      </Menu.Positioner>
    </Menu.Root>
  );
}
