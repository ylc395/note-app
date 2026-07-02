import { SearchIcon } from 'lucide-solid';
import { createMemo } from 'solid-js';

import { useContext } from './context';

export default function SearchBox() {
  const memoList = createMemo(() => useContext()!.memoList);

  function handleInput(e: InputEvent) {
    memoList().filter.setKeyword((e.target as HTMLInputElement).value);
  }

  return (
    <label class="flex items-center w-full rounded-md bg-bg-tertiary px-2 mb-4 transition-colors focus-within:bg-bg-primary focus-within:border-border-accent border border-transparent">
      <SearchIcon class="w-4 h-4 mr-1.5 shrink-0 text-fg-tertiary" />
      <input
        onInput={handleInput}
        disabled={memoList().filter.isRandom}
        placeholder={memoList().filter.isRandom ? '随机浏览时不支持搜索' : '搜索 memo'}
        class="block py-1.5 text-sm grow bg-transparent text-fg-primary placeholder:text-fg-tertiary outline-none"
      />
    </label>
  );
}
