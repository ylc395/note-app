import { CaseSensitiveIcon, WholeWordIcon } from 'lucide-solid';
import { action } from 'mobx';

import type TextFinder from './TextFinder';
import { onMount } from 'solid-js';

export default function Input(props: { textFinder: TextFinder }) {
  let inputRef: HTMLInputElement | undefined;

  function handleInput(e: InputEvent & { target: HTMLInputElement }) {
    props.textFinder.model.setQuery(e.target.value);
  }

  onMount(() => {
    inputRef?.focus();
  });

  return (
    <div class="flex bg-white border mr-2">
      <input
        ref={inputRef}
        class="outline-none bg-transparent"
        value={props.textFinder.model.options.query}
        onInput={action(handleInput)}
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
