import { container } from 'tsyringe';
import { useAsyncEffect } from 'ahooks';
import { pick, get } from 'lodash-es';
import assert from 'assert';

import { token, type SeparatorItem, type CommonMenuItem, type MenuItem as BaseMenuItem } from '@domain/shared/infra/ui';

type MenuItem = Pick<CommonMenuItem, 'checked' | 'disabled' | 'label'> & {
  onSelect?: () => void;
  submenu?: MenuItem[];
};

export interface Props {
  items: Array<MenuItem | SeparatorItem>;
  isOpen: boolean;
  native?: boolean;
  position?: { x: number; y: number };
  onClose: () => void;
}

function getMapper(path: string[] = []) {
  return (item: MenuItem | SeparatorItem, i: number): BaseMenuItem => {
    const currentPath = [...path, String(i)];

    return 'type' in item
      ? item
      : {
          ...pick(item, ['checked', 'disabled', 'label']),
          key: currentPath.join(),
          submenu: item.submenu?.map(getMapper(currentPath)),
        };
  };
}

export default function Menu({ items, position, native = false, isOpen, onClose }: Props) {
  const ui = container.resolve(token);
  const isNative = native && ui.getActionFromMenu;

  useAsyncEffect(async () => {
    if (isOpen && isNative) {
      const transformedItems = items.map(getMapper());
      const index = await ui.getActionFromMenu!(transformedItems, position);

      if (typeof index === 'string') {
        const menuItem = get(
          items,
          index.split(',').flatMap((key, i) => (i === 0 ? key : ['submenu', key])),
        ) as MenuItem;

        menuItem.onSelect?.();
      }

      onClose();
    }
  }, [isOpen, isNative]);

  if (!isOpen || isNative) {
    return null;
  }

  assert.fail('web menu is not implement');
}
