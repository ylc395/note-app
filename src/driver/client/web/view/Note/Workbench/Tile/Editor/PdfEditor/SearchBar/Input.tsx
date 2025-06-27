import { CaseSensitiveIcon, WholeWordIcon } from 'lucide-solid';
import { onMount } from 'solid-js';

import type TextFinder from './TextFinder';

export default function Input(props: { textFinder: TextFinder }) {
  let inputRef: HTMLInputElement | undefined;

  function handleInput(e: InputEvent & { target: HTMLInputElement }) {
    props.textFinder.model.setQuery(e.target.value);
  }

  function handleKeyPress(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      props.textFinder.next();
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
        value={props.textFinder.model.options.query ?? ''}
        onInput={handleInput}
        onKeyPress={handleKeyPress}
      />
      <div class="flex space-x-1 pr-1">
        <button
          class="flex items-center justify-center"
          classList={{ outline: props.textFinder.model.options.caseSensitive }}
          onClick={() => props.textFinder.model.toggleOption('caseSensitive')}
        >
          <CaseSensitiveIcon />
        </button>
        <button
          class="flex items-center justify-center"
          classList={{ outline: props.textFinder.model.options.entireWord }}
          onClick={() => props.textFinder.model.toggleOption('entireWord')}
        >
          <WholeWordIcon />
        </button>
      </div>
    </div>
  );
}
