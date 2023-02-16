import EmojiMart from '@emoji-mart/react';
import type { EmojiMartData } from '@emoji-mart/data';
import { init } from 'emoji-mart';
import { useEffect } from 'react';
import { container } from 'tsyringe';

import { token as remoteToken } from 'infra/Remote';

const data = async () => {
  const remote = container.resolve(remoteToken);
  const { body } = await remote.get<void, EmojiMartData>('/icons/data');

  return body;
};

interface Props {
  onSelect: (id: string) => void;
  onClickOutside: () => void;
}

// eslint-disable-next-line mobx/missing-observer
export function EmojiPicker({ onSelect, onClickOutside }: Props) {
  return (
    <EmojiMart
      maxFrequentRows={2}
      previewPosition="none"
      data={data}
      onClickOutside={onClickOutside}
      onEmojiSelect={({ shortcodes }: { shortcodes: string }) => onSelect(shortcodes)}
    />
  );
}

export interface EmojiProps {
  id?: string | null;
  className?: string;
  size?: string;
}

let inited = false;
// eslint-disable-next-line mobx/missing-observer
export function Emoji({ id, className, size }: EmojiProps) {
  useEffect(() => {
    if (inited) {
      return;
    }

    inited = true;
    init({ data });
  }, []);

  return id ? (
    <span className={className}>
      <em-emoji size={size || '1.5em'} shortcodes={id.replace(/^emoji:/, '')}></em-emoji>
    </span>
  ) : null;
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
