import clsx from 'clsx';
import { createMemo, splitProps, type JSX } from 'solid-js';

const sizeClasses = {
  lg: { default: 'h-10 px-4 text-base', square: 'size-10 text-base' },
  md: { default: 'h-8 px-3 text-sm', square: 'size-8 text-sm' },
  small: { default: 'h-6 px-2 text-xs', square: 'size-6 text-xs' },
  tiny: { default: 'h-5 px-1.5 text-xs', square: 'size-5 text-xs' },
};

const iconSizeClasses = {
  lg: '[&>.lucide-icon]:size-6',
  md: '[&>.lucide-icon]:size-5',
  small: '[&>.lucide-icon]:size-4',
  tiny: '[&>.lucide-icon]:size-3',
};

export default function Button(
  props: {
    size?: 'lg' | 'md' | 'small' | 'tiny';
    variant?: 'primary' | 'secondary';
    square?: boolean;
    children?: JSX.Element;
  } & JSX.ButtonHTMLAttributes<HTMLButtonElement>,
) {
  const [local, rest] = splitProps(props, ['disabled', 'size', 'variant', 'square', 'children', 'class']);

  const isPrimary = createMemo(() => local.variant === 'primary');
  const size = createMemo(() => local.size ?? 'md');

  return (
    <button
      {...rest}
      disabled={local.disabled}
      class={clsx(
        'flex items-center justify-center rounded cursor-pointer select-none transition-colors',
        local.square ? sizeClasses[size()].square : sizeClasses[size()].default,
        iconSizeClasses[size()],
        isPrimary()
          ? 'bg-bg-accent text-fg-accent hover:bg-bg-accent-hover disabled:bg-bg-disabled disabled:text-fg-disabled'
          : 'bg-transparent text-fg-primary hover:bg-bg-hover active:bg-bg-active disabled:text-fg-disabled disabled:bg-transparent',
        local.class,
      )}
    >
      {local.children}
    </button>
  );
}
