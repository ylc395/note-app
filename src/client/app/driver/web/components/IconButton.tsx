import clsx from 'clsx';
import type { MouseEvent, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  selected?: boolean;
  size?: 'small' | 'medium';
}

export default function IconButton({ children, className, onClick, disabled, selected, size = 'medium' }: Props) {
  const handleClick =
    onClick &&
    ((e: MouseEvent) => {
      e.stopPropagation();
      onClick();
    });

  return (
    <button
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
}
