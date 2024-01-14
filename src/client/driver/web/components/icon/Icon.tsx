import emojiData from '@emoji-mart/data/sets/14/native.json';
import clsx from 'clsx';
import { init } from 'emoji-mart';
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
      className?: string;
    }
  }
}

export default observer(function Emoji({ code, className, size, fallback }: EmojiProps) {
  return (
    isEmojiReady.get() && (
      <span className={clsx(className, 'inline-flex')}>
        {code ? <em-emoji size={size || '1em'} className={className} shortcodes={code}></em-emoji> : fallback}
      </span>
    )
  );
});
