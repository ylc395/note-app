import emojiData from '@emoji-mart/data/sets/14/native.json';
import { init } from 'emoji-mart';
import clsx from 'clsx';
import { action, observable } from 'mobx';
import { observer } from 'mobx-react-lite';
import type { ReactNode } from 'react';

const isEmojiReady = observable.box(false);

init({ data: emojiData }).then(action(() => isEmojiReady.set(true)));

export interface EmojiProps {
  code: string | null;
  className?: string;
  fallback?: ReactNode;
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

export default observer(function Emoji({ code, className, size, fallback }: EmojiProps) {
  const shouldShow = isEmojiReady.get() && (code || fallback);

  return shouldShow ? (
    <span className={clsx(className)}>
      {code ? <em-emoji size={size || '1em'} shortcodes={code}></em-emoji> : fallback}
    </span>
  ) : null;
});
