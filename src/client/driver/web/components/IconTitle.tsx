import { Emoji, type EmojiProps } from './Emoji';

interface Props {
  className?: string;
  title: string;
  icon?: string | null;
  size?: EmojiProps['size'];
  titleClassName?: string;
}

export default function IconTitle({ titleClassName, className, icon = null, title, size }: Props) {
  return (
    <span className={`flex items-center ${className || ''}`}>
      <Emoji id={icon} className="mr-1" size={size} />
      <span className={`whitespace-nowrap ${titleClassName}`}>{title}</span>
    </span>
  );
}
