import emojiData from '@emoji-mart/data/sets/14/native.json';
import EmojiMart from '@emoji-mart/react';
import assert from 'assert';
import { useEffect, useRef, useState } from 'react';
import { ClearOutlined } from '@ant-design/icons';

import Button from '../Button';

interface Props {
  canClear: boolean;
  onSelect: (emojiCode: string | null) => void;
}

export default function EmojiPicker({ onSelect, canClear }: Props) {
  const divRef = useRef<HTMLDivElement | null>(null);
  const [isClearVisible, setIsClearVisible] = useState(false);

  useEffect(() => {
    assert(divRef.current);
    const shadowRoot = divRef.current.querySelector('em-emoji-picker')!.shadowRoot!;
    const observer = new MutationObserver((_, _observer) => {
      const searchRowEl = shadowRoot.querySelector('.search')?.parentElement;

      if (searchRowEl) {
        searchRowEl.style.paddingRight = '20px';
        setIsClearVisible(true);
        _observer.disconnect();
      }
    });

    observer.observe(shadowRoot, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={divRef} className="relative">
      {isClearVisible && (
        <Button
          disabled={!canClear}
          onClick={() => onSelect(null)}
          className="absolute right-[10px] top-[15px] z-10 text-gray-600"
        >
          <ClearOutlined />
        </Button>
      )}
      <EmojiMart
        maxFrequentRows={2}
        previewPosition="none"
        navPosition="bottom"
        data={emojiData}
        onEmojiSelect={({ shortcodes }: { shortcodes: string }) => onSelect(shortcodes)}
      />
    </div>
  );
}
