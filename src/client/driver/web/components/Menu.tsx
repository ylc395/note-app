import { container } from 'tsyringe';
import { useAsyncEffect } from 'ahooks';
import assert from 'assert';

import { type MenuItem, token, type MenuItemKey } from '@shared/domain/infra/ui';

export interface Props {
  items: MenuItem[];
  isOpen: boolean;
  native?: boolean;
  position?: { x: number; y: number };
  onSelect: (key: MenuItemKey) => void;
  onClose: () => void;
}

export default function Menu({ items, position, native = false, isOpen, onClose, onSelect }: Props) {
  const ui = container.resolve(token);
  const isNative = native && ui.getActionFromMenu;

  useAsyncEffect(async () => {
    if (isOpen && isNative) {
      const action = await ui.getActionFromMenu!(items, position);

      if (action) {
        onSelect(action);
      }

      onClose();
    }
  }, [isOpen, isNative]);

  if (!isOpen || isNative) {
    return null;
  }

  assert.fail('web menu is not implement');
}
