import { container } from 'tsyringe';
import { type MenuItem, token } from '@domain/infra/ui';
import Button, { type Props as ButtonProps } from './Button';
import { useRef } from 'react';

interface Props {
  items: MenuItem[];
  children: ButtonProps['children'];
  onClick?: (action: string) => void;
}

export default function ButtonMenu({ items, children, onClick }: Props) {
  const { getActionFromMenu } = container.resolve(token);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const handleClick = async () => {
    const { x, y, width } = buttonRef.current!.getBoundingClientRect();
    const action = await getActionFromMenu(items, { x: x + width, y: y + 10 });

    if (action) {
      onClick?.(action);
    }
  };

  return (
    <Button ref={buttonRef} onClick={handleClick}>
      {children}
    </Button>
  );
}
