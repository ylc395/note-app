import emojiData from '@emoji-mart/data/sets/14/apple.json';
import { constant } from 'lodash-es';

import EmojiMart from '@emoji-mart/react';

interface Props {
  onSelect: (id: string) => void;
  onClickOutside: () => void;
}

const getSpritesheetURL = constant(window.IS_ELECTRON ? 'aa' : '');

export function EmojiPicker({ onSelect, onClickOutside }: Props) {
  return (
    <EmojiMart
      maxFrequentRows={2}
      previewPosition="none"
      getSpritesheetURL={getSpritesheetURL}
      data={emojiData}
      onClickOutside={onClickOutside}
      onEmojiSelect={({ shortcodes }: { shortcodes: string }) => onSelect(shortcodes)}
    />
  );
}
