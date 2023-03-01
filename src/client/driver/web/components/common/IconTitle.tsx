import { observer } from 'mobx-react-lite';
import { Emoji, type EmojiProps } from '../note/Emoji';

interface Props {
  className?: string;
  title: string;
  icon?: string | null;
  size?: EmojiProps['size'];
  titleClassName?: string;
}

export default observer(function IconTitle({ titleClassName, className, icon = null, title, size }: Props) {
  return (
    <span className={`flex items-center ${className || ''}`}>
      <Emoji id={icon} className="mr-1" size={size} />
      <span className={`whitespace-nowrap ${titleClassName}`}>{title}</span>
    </span>
  );
});
