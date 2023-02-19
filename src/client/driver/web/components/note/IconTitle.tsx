import { observer } from 'mobx-react-lite';

import { normalizeTitle, NoteVO } from 'interface/Note';

import { Emoji, type EmojiProps } from '../Emoji';

interface Props {
  className?: string;
  note?: NoteVO;
  title?: NoteVO['title'];
  icon?: NoteVO['icon'];
  id?: NoteVO['id'];
  size?: EmojiProps['size'];
}

export default observer(function NoteIconTitle({ className, note, icon, title, id, size }: Props) {
  return (
    <span className={`flex items-center ${className || ''}`}>
      <Emoji id={icon || note?.icon || null} className="mr-1" size={size} />
      <span className="whitespace-nowrap">
        {__ENV__ === 'dev' ? `${id || note?.id} ` : null}
        {title || (note && normalizeTitle(note))}
      </span>
    </span>
  );
});
