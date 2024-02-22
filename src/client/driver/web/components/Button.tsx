import clsx from 'clsx';
import { type MouseEvent, type ReactNode, forwardRef, MouseEventHandler } from 'react';

export interface Props {
  children: ReactNode;
  className?: string;
  onClick?: MouseEventHandler;
  stopPropagation?: boolean;
  disabled?: boolean;
  selected?: boolean;
  size?: 'small' | 'medium';
}

export default forwardRef<HTMLButtonElement, Props>(function Button(
  { children, stopPropagation, className, onClick, disabled, selected, size = 'medium' },
  ref,
) {
  const handleClick = (e: MouseEvent) => {
    stopPropagation && e.stopPropagation();
    onClick?.(e);
  };

  return (
    <button
      ref={ref}
      disabled={disabled}
      onClick={handleClick}
      className={clsx(
        'flex  cursor-pointer items-center justify-center rounded border-0  p-1',
        size === 'small' && 'text-sm',
        size === 'medium' && 'text-lg',
        selected ? 'bg-gray-200' : 'bg-transparent hover:bg-gray-100',
        disabled && 'opacity-40',
        className,
      )}
    >
      {children}
    </button>
  );
});
