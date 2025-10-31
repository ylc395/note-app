import { Menu, type UseMenuReturn } from '@ark-ui/solid';
import { ChevronRightIcon } from 'lucide-solid';
import type { JSX } from 'solid-js';

export interface MenuItem {
  label: string;
  key: string;
  className?: string;
  disabled?: boolean;
  children?: Array<MenuItem | 'separator'>;
  content?: (e: { closeMenu: () => void }) => JSX.Element;
}

// 这个组件没有响应性
export default function Item(props: { item: MenuItem | 'separator'; menu: UseMenuReturn; contentClassName?: string }) {
  function closeMenu() {
    props.menu.api().setOpen(false);
  }

  if (props.item === 'separator') {
    return <Menu.Separator />;
  }

  if (!props.item.children && !props.item.content) {
    return (
      <Menu.Item
        disabled={props.item.disabled}
        class={`menu-item ${props.item.className || ''}`}
        value={props.item.key}
      >
        {props.item.label}
      </Menu.Item>
    );
  }

  return (
    <Menu.Root lazyMount unmountOnExit>
      <Menu.TriggerItem class={`menu-item ${props.item.className}`}>
        <span class="grow">{props.item.label}</span>
        <Menu.Indicator>
          <ChevronRightIcon />
        </Menu.Indicator>
      </Menu.TriggerItem>
      <Menu.Positioner>
        <Menu.Content class={props.contentClassName}>
          {props.item.content?.({ closeMenu }) ||
            props.item.children?.map((child) => <Item item={child} menu={props.menu} />)}
        </Menu.Content>
      </Menu.Positioner>
    </Menu.Root>
  );
}
