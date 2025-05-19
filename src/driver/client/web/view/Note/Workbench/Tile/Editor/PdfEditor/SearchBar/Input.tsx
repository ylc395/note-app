import { CaseSensitiveIcon } from 'lucide-solid';
import { action } from 'mobx';

import type Searcher from './Searcher';

export default function Input(props: { searcher: Searcher }) {
  function handleInput(e: InputEvent & { target: HTMLInputElement }) {
    props.searcher.options.query = e.target.value;
  }

  return (
    <div class="flex bg-white border mr-2">
      <input class="outline-none bg-transparent" value={props.searcher.options.query} onInput={action(handleInput)} />
      <div>
        <button
          classList={{
            outline: props.searcher.options.caseSensitive,
          }}
          onClick={() => props.searcher.toggle('caseSensitive')}
        >
          <CaseSensitiveIcon />
        </button>
      </div>
    </div>
  );
}
