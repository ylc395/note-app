import { useRef } from 'react';
import { container } from 'tsyringe';
import assert from 'assert';

import Button, { type Props as ButtonProps } from '@web/components/Button';
import { token as uiToken, type MenuItem } from '@domain/common/infra/ui';

export interface Props {
  icon?: ButtonProps['icon'];
  size?: ButtonProps['size'];
  variant?: ButtonProps['variant'];
  disabled?: ButtonProps['disabled'];
  menuItems: MenuItem[];
  onMenuClick: (key: string | number) => void;
}

export default (function MenuButton({ variant, size, icon, disabled, menuItems, onMenuClick }: Props) {
  const { getActionFromMenu } = container.resolve(uiToken);
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  async function createMenu() {
    assert(buttonRef.current);

    const { x, y, height } = buttonRef.current.getBoundingClientRect();
    const key = await getActionFromMenu(menuItems, { x: x, y: y + height + 10 });

    if (key) {
      onMenuClick?.(key);
    }
  }

  return <Button variant={variant} size={size} onClick={createMenu} disabled={disabled} ref={buttonRef} icon={icon} />;
});
