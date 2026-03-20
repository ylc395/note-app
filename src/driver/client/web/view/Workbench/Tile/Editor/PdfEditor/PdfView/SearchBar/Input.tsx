import { CaseSensitiveIcon, WholeWordIcon } from 'lucide-solid';
import { onMount } from 'solid-js';

import { useContext } from '../../context';

export default function Input() {
  let inputRef: HTMLInputElement | undefined;
  const {
    viewer: {
      editor: { textFinder },
      viewer,
    },
  } = useContext()!;

  function handleInput(e: InputEvent & { target: HTMLInputElement }) {
    textFinder.setKeyword(e.target.value);
  }

  function handleKeyPress(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      viewer.textFinder.next();
    }
  }

  onMount(() => {
    inputRef?.select();
  });

  return (
    <div class="flex bg-white border mr-2">
      <input
        ref={inputRef}
        class="outline-none bg-transparent"
        value={textFinder.options.query || ''}
        onInput={handleInput}
        onKeyPress={handleKeyPress}
      />
      <div class="flex space-x-1 pr-1">
        <button
          class="flex items-center justify-center"
          classList={{ outline: textFinder.options.caseSensitive }}
          onClick={() => textFinder.toggleOption('caseSensitive')}
        >
          <CaseSensitiveIcon />
        </button>
        <button
          class="flex items-center justify-center"
          classList={{ outline: textFinder.options.entireWord }}
          onClick={() => textFinder.toggleOption('entireWord')}
        >
          <WholeWordIcon />
        </button>
      </div>
    </div>
  );
}
