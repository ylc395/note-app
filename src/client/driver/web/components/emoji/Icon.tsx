import emojiData from '@emoji-mart/data/sets/14/apple.json';
import { init } from 'emoji-mart';
import clsx from 'clsx';
import { observable } from 'mobx';
import { observer } from 'mobx-react-lite';

const isEmojiReady = observable.box(false);

init({ data: emojiData }).then(() => isEmojiReady.set(true));

export interface EmojiProps {
  id: string | null;
  className?: string;
  size?: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      ['em-emoji']: EmEmojiAttributes;
    }

    interface EmEmojiAttributes {
      shortcodes: string;
      size: string;
    }
  }
}

export default observer(function Emoji({ id, className, size }: EmojiProps) {
  return isEmojiReady.get() && id ? (
    <span className={clsx(className)}>
      <em-emoji size={size || '1.5em'} shortcodes={id.replace(/^emoji:/, '')}></em-emoji>
    </span>
  ) : null;
});
