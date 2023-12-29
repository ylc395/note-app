import clsx from 'clsx';
import { default as Emoji, type EmojiProps } from './emoji/Icon';

interface Props {
  className?: string;
  onClick?: () => void;
  title: string;
  icon?: string | null;
  size?: EmojiProps['size'];
  titleClassName?: string;
}

export default function IconTitle({ titleClassName, className, icon = null, title, size, onClick }: Props) {
  return (
    <span className={clsx('flex items-center', className)} onClick={onClick}>
      <Emoji id={icon} className="mr-1" size={size} />
      <span className={clsx('whitespace-nowrap', titleClassName)}>{title}</span>
    </span>
  );
}
