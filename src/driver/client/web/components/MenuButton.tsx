import { useRef, useState } from 'react';
import { useBoolean } from 'ahooks';

import Button, { type Props as ButtonProps } from '@web/components/Button';
import Menu, { type Props as MenuProps } from './Menu';
import assert from 'assert';

export interface Props {
  button: {
    icon?: ButtonProps['icon'];
    size?: ButtonProps['size'];
    variant?: ButtonProps['variant'];
    disabled?: ButtonProps['disabled'];
  };
  menuItems: MenuProps['items'];
}

export default (function MenuButton({ button, menuItems }: Props) {
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const [isOpen, { setTrue: open, setFalse: close }] = useBoolean(false);
  const [position, setPosition] = useState<{ x: number; y: number }>();

  function onClick() {
    assert(buttonRef.current);
    const { x, y, height } = buttonRef.current.getBoundingClientRect();

    setPosition({ x, y: y + height + 10 });
    open();
  }

  return (
    <>
      <Button {...button} onClick={onClick} ref={buttonRef} />
      <Menu native items={menuItems} position={position} isOpen={isOpen} onClose={close} />
    </>
  );
});
