import { type ReactNode, useRef } from 'react';
import { container } from 'tsyringe';

import Button from '@web/components/Button';
import { token as uiToken, type MenuItem } from '@domain/common/infra/ui';

export interface Props {
  icon: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  menuItems?: MenuItem[];
  onMenuClick?: (key: string) => void;
}

// eslint-disable-next-line mobx/missing-observer
export default (function HeaderButton({ onClick, icon, disabled, menuItems, onMenuClick }: Props) {
  const { getActionFromMenu } = container.resolve(uiToken);
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  async function createMenu() {
    if (!menuItems || !onMenuClick || !buttonRef.current) {
      return;
    }

    const { x, y, height } = buttonRef.current.getBoundingClientRect();
    console.log(x, y);

    const key = await getActionFromMenu(menuItems, { x: x, y: y + height + 10 });

    if (key) {
      onMenuClick?.(key);
    }
  }

  return (
    <Button onClick={onClick || createMenu} disabled={disabled} ref={buttonRef}>
      {icon}
    </Button>
  );
});
