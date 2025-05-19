import { CaseSensitiveIcon } from 'lucide-solid';
import { action } from 'mobx';

import type Searcher from './Searcher';
import { onMount } from 'solid-js';

export default function Input(props: { searcher: Searcher }) {
  let inputRef: HTMLInputElement | undefined;

  function handleInput(e: InputEvent & { target: HTMLInputElement }) {
    props.searcher.options.query = e.target.value;
  }

  onMount(() => {
    inputRef?.focus();
  });

  return (
    <div class="flex bg-white border mr-2">
      <input
        ref={inputRef}
        class="outline-none bg-transparent"
        value={props.searcher.options.query}
        onInput={action(handleInput)}
      />
      <div>
        <button
          classList={{
            outline: props.searcher.options.caseSensitive,
          }}
          onClick={() => props.searcher.toggleOption('caseSensitive')}
        >
          <CaseSensitiveIcon />
        </button>
      </div>
    </div>
  );
}
