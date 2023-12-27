import clsx from 'clsx';
import { type MouseEvent, type ReactNode, forwardRef } from 'react';

export interface Props {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  selected?: boolean;
  size?: 'small' | 'medium';
}

export default forwardRef<HTMLButtonElement, Props>(function Button(
  { children, className, onClick, disabled, selected, size = 'medium' },
  ref,
) {
  const handleClick =
    onClick &&
    ((e: MouseEvent) => {
      e.stopPropagation();
      onClick();
    });

  return (
    <button
      ref={ref}
      disabled={disabled}
      onClick={handleClick}
      className={clsx(
        'cursor-pointer rounded border-0  p-1',
        size === 'small' && 'text-sm',
        size === 'medium' && 'text-lg',
        selected ? 'bg-gray-300' : 'bg-transparent hover:bg-gray-100',
        className,
      )}
    >
      {children}
    </button>
  );
});