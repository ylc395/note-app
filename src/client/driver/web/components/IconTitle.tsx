import clsx from 'clsx';
import type { ReactNode } from 'react';
import { default as Icon, type EmojiProps } from './icon/Icon';

interface Props {
  className?: string;
  onClick?: () => void;
  onDoubleClick?: () => void;
  title: string;
  icon: string | null;
  defaultIcon?: ReactNode;
  iconSize?: EmojiProps['size'];
  titleClassName?: string;
}

export default function IconTitle({
  titleClassName,
  className,
  icon,
  defaultIcon,
  title,
  iconSize,
  onClick,
  onDoubleClick,
}: Props) {
  return (
    <span onDoubleClick={onDoubleClick} className={clsx('flex items-center', className)} onClick={onClick}>
      <Icon code={icon} className="mr-1 shrink-0" size={iconSize} fallback={defaultIcon} />
      <span className={clsx('whitespace-nowrap', titleClassName)}>{title}</span>
    </span>
  );
}
