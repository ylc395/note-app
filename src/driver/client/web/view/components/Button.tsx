import { cva, type VariantProps } from 'class-variance-authority';
import { cx } from 'class-variance-authority';
import { createMemo, splitProps, type JSX } from 'solid-js';

const buttonVariants = cva('flex items-center justify-center rounded cursor-pointer select-none transition-colors', {
  variants: {
    intent: {
      primary: 'bg-bg-accent text-fg-accent hover:bg-bg-accent-hover disabled:bg-bg-disabled disabled:text-fg-disabled',
      secondary: 'text-fg-primary hover:bg-bg-hover active:bg-bg-active',
    },
    size: {
      lg: 'h-10 px-4 text-base [&>.lucide-icon]:size-6',
      'lg-square': 'size-10 text-base [&>.lucide-icon]:size-6',
      md: 'h-8 px-3 text-sm [&>.lucide-icon]:size-5',
      'md-square': 'size-8 text-sm [&>.lucide-icon]:size-5',
      small: 'h-6 px-2 text-xs [&>.lucide-icon]:size-4',
      'small-square': 'size-6 text-xs [&>.lucide-icon]:size-4',
      tiny: 'h-5 px-1.5 text-xs [&>.lucide-icon]:size-3',
      'tiny-square': 'size-5 text-xs [&>.lucide-icon]:size-3',
    },
    active: {
      true: null,
      false: null,
    },
  },
  compoundVariants: [
    {
      intent: 'secondary',
      active: false,
      class: 'bg-transparent',
    },
    {
      intent: 'secondary',
      active: true,
      class: 'bg-bg-accent-subtle',
    },
  ],
  defaultVariants: {
    intent: 'secondary',
    size: 'md',
    active: false,
  },
});

export type ButtonProps = VariantProps<typeof buttonVariants>;

export default function Button(
  props: {
    size?: 'lg' | 'md' | 'small' | 'tiny';
    intent?: 'primary' | 'secondary';
    square?: boolean;
    children?: JSX.Element;
    selected?: boolean;
  } & JSX.ButtonHTMLAttributes<HTMLButtonElement>,
) {
  const [local, rest] = splitProps(props, ['disabled', 'size', 'intent', 'square', 'children', 'class', 'selected']);

  const sizeKey = createMemo(() => {
    const s = local.size ?? 'md';
    return local.square ? (`${s}-square` as const) : s;
  });

  return (
    <button
      {...rest}
      disabled={local.disabled}
      class={cx(
        buttonVariants({
          intent: local.intent,
          size: sizeKey(),
          active: local.selected,
        }),
        local.class,
      )}
    >
      {local.children}
    </button>
  );
}
