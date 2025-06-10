import { CaseSensitiveIcon, WholeWordIcon } from 'lucide-solid';
import { action } from 'mobx';

import type Searcher from './Searcher';
import { onMount } from 'solid-js';

export default function Input(props: { searcher: Searcher }) {
  let inputRef: HTMLInputElement | undefined;

  function handleInput(e: InputEvent & { target: HTMLInputElement }) {
    props.searcher.textFinder.setQuery(e.target.value);
  }

  onMount(() => {
    inputRef?.focus();
  });

  return (
    <div class="flex bg-white border mr-2">
      <input
        ref={inputRef}
        class="outline-none bg-transparent"
        value={props.searcher.textFinder.options.query}
        onInput={action(handleInput)}
      />
      <div class="flex space-x-1 pr-1">
        <button
          class="flex items-center justify-center"
          classList={{ outline: props.searcher.textFinder.options.caseSensitive }}
          onClick={() => props.searcher.textFinder.toggleOption('caseSensitive')}
        >
          <CaseSensitiveIcon />
        </button>
        <button
          class="flex items-center justify-center"
          classList={{ outline: props.searcher.textFinder.options.entireWord }}
          onClick={() => props.searcher.textFinder.toggleOption('entireWord')}
        >
          <WholeWordIcon />
        </button>
      </div>
    </div>
  );
}
