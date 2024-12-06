import { useBoolean, useClickAway, useEventListener } from 'ahooks';
import { noop } from 'lodash-es';
import { cloneElement, useRef, type ReactElement } from 'react';
import { createPortal } from 'react-dom';

export type MenuItem = CommonMenuItem | SeparatorItem;

export interface SeparatorItem {
  type: 'separator';
}

export interface CommonMenuItem {
  id: string;
  label: string;
  disabled?: boolean;
  checked?: boolean;
  submenu?: MenuItem[];
}

export interface Props {
  items: Array<MenuItem | SeparatorItem> | (() => Array<MenuItem | SeparatorItem>);
  preferNative?: boolean;
  children: ReactElement;
  position?: { x: number; y: number };
  trigger?: 'click' | 'contextmenu';
  onMenuClick?: (key: CommonMenuItem['id']) => void;
}

export default function Dropdown({ items, position, trigger = 'click', preferNative, children, onMenuClick }: Props) {
  const showNativeMenu = async () => {
    const key = await window.electronUI!.getActionFromMenu(typeof items === 'function' ? items() : items, position);

    if (typeof key === 'string') {
      onMenuClick?.(key);
    }
  };

  const triggerRef = useRef<HTMLElement | null>(null);
  const menuRef = useRef<HTMLElement | null>(null);
  const [isWebMenuShow, { setTrue: showWebMenu, setFalse: hideWebMenu }] = useBoolean(false);
  const showMenu = preferNative && window.electronUI ? showNativeMenu : showWebMenu;

  const menu = isWebMenuShow
    ? createPortal(
        <menu ref={menuRef}>
          {(typeof items === 'function' ? items() : items).map((item, i) =>
            'type' in item ? (
              <br key={i} />
            ) : (
              <li key={item.id} onClick={onMenuClick?.bind(null, item.id)}>
                {item.label}
              </li>
            ),
          )}
        </menu>,
        document.body,
      )
    : null;

  useClickAway(hideWebMenu, menuRef);
  useEventListener('click', trigger === 'click' ? showMenu : noop, { target: triggerRef });
  useEventListener('contextmenu', trigger === 'contextmenu' ? showMenu : noop, { target: triggerRef });

  return (
    <>
      {cloneElement(children, { ref: triggerRef })}
      {menu}
    </>
  );
}
