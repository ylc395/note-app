import clsx from 'clsx';
import type { ReactNode } from 'react';
import { default as Emoji, type EmojiProps } from './icon/Icon';

interface Props {
  className?: string;
  onClick?: () => void;
  title: string;
  icon: string | null;
  defaultIcon?: ReactNode;
  iconSize?: EmojiProps['size'];
  titleClassName?: string;
}

export default function IconTitle({ titleClassName, className, icon, defaultIcon, title, iconSize, onClick }: Props) {
  return (
    <span className={clsx('flex items-center', className)} onClick={onClick}>
      <Emoji code={icon} className="mr-1" size={iconSize} fallback={defaultIcon} />
      <span className={clsx('whitespace-nowrap', titleClassName)}>{title}</span>
    </span>
  );
}
