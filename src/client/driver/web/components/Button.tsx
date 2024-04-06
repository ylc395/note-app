import { type MouseEvent, type ReactNode, forwardRef, MouseEventHandler } from 'react';
import clsx from 'clsx';

export interface Props {
  children?: ReactNode;
  onClick?: MouseEventHandler;
  disabled?: boolean;
  className?: string;
  icon?: ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'small' | 'medium' | 'large';
}

export default forwardRef<HTMLButtonElement, Props>(function Button(
  { children, icon, onClick, disabled, className, variant = 'ghost', size = 'medium' },
  ref,
) {
  const handleClick = (e: MouseEvent) => {
    e.stopPropagation();
    onClick?.(e);
  };

  const isIconButton = icon && !children;

  return (
    <button
      ref={ref}
      disabled={disabled}
      onClick={handleClick}
      className={clsx(
        'inline-flex justify-center items-center border-0 p-0 ',
        className,
        disabled && 'opacity-50',
        disabled ? 'cursor-not-allowed' : 'cursor-pointer',
        size === 'small' && 'h-4 [--icon-size:14px]',
        size === 'small' && isIconButton && 'w-4 rounded',
        size === 'medium' && 'h-8 [--icon-size:20px] rounded-md',
        size === 'medium' && isIconButton && 'w-8',
        size === 'large' && 'h-10 [--icon-size:20px] rounded-lg',
        size === 'large' && isIconButton && 'w-10',
        variant === 'ghost' && 'text-button-ghost bg-button-ghost',
        variant === 'ghost' && !disabled && 'hover:bg-button-ghost-highlight',
        variant === 'primary' && 'text-button-primary bg-button-primary',
        variant === 'primary' && !disabled && 'hover:bg-button-primary-highlight',
        variant === 'danger' && 'text-button-danger bg-button-danger',
        variant === 'danger' && !disabled && 'hover:bg-button-danger-highlight',
      )}
    >
      {icon}
      {children}
    </button>
  );
});
