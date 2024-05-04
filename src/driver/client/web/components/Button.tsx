import { type MouseEvent, type ReactNode, forwardRef, MouseEventHandler } from 'react';
import clsx from 'clsx';

export interface Props {
  children?: ReactNode;
  onClick?: MouseEventHandler;
  disabled?: boolean;
  className?: string;
  icon?: ReactNode;
  block?: boolean;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'tiny' | 'small' | 'medium' | 'large';
}

export default forwardRef<HTMLButtonElement, Props>(function Button(
  { children, icon, onClick, disabled, className, variant = 'ghost', size = 'medium', block = false },
  ref,
) {
  const handleClick = (e: MouseEvent) => {
    e.stopPropagation();
    onClick?.(e);
  };

  const isIconButton = icon && typeof children === 'undefined';

  return (
    <button
      ref={ref}
      disabled={disabled}
      onClick={handleClick}
      className={clsx(
        'justify-center items-center border-0 box-content p-0',
        className,
        disabled && 'opacity-50',
        block ? 'flex w-full' : 'inline-flex',
        disabled ? 'cursor-not-allowed' : 'cursor-pointer',
        size === 'tiny' && '[--icon-size:14px] h-4 rounded text-xs',
        size === 'tiny' && isIconButton && 'w-4',
        size === 'small' && '[--icon-size:16px] h-6 rounded text-sm',
        size === 'small' && isIconButton && 'w-6',
        size === 'medium' && '[--icon-size:20px] h-8 rounded-md',
        size === 'medium' && isIconButton && 'w-8',
        size === 'large' && 'h-10 [--icon-size:20px] rounded-lg',
        size === 'large' && isIconButton && 'w-10',
        variant === 'ghost' && 'text-button-ghost bg-button-ghost',
        variant === 'ghost' && !disabled && 'hover:bg-button-ghost-highlight',
        variant === 'primary' && 'text-button-primary bg-button-primary',
        variant === 'primary' && !disabled && 'hover:bg-button-primary-highlight',
        variant === 'secondary' && 'text-button-secondary',
        variant === 'secondary' && !disabled && 'hover:bg-button-secondary-highlight',
        variant === 'danger' && 'text-button-danger bg-button-danger',
        variant === 'danger' && !disabled && 'hover:bg-button-danger-highlight',
      )}
    >
      {icon}
      {children}
    </button>
  );
});
