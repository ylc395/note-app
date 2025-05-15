import { CaseSensitiveIcon, StickyNoteIcon } from 'lucide-solid';
import { debounce } from 'lodash-es';

import type TextSearcher from '#domain/client/app/model/note/editor/PdfEditor/TextSearcher';
import { onCleanup } from 'solid-js';

export default function Input(props: { searcher: TextSearcher }) {
  const handleInput = debounce((e: InputEvent & { target: HTMLInputElement }) => {
    props.searcher.setKeyword(e.target.value);
  }, 500);

  onCleanup(() => {
    handleInput.cancel();
  });

  return (
    <div class="flex bg-white border mr-2">
      <input class="outline-none bg-transparent" value={props.searcher.options.keyword} onInput={handleInput} />
      <div>
        <button
          classList={{
            outline: props.searcher.options.isCaseSensitive,
          }}
          onClick={() => props.searcher.toggle('isCaseSensitive')}
        >
          <CaseSensitiveIcon />
        </button>
        <button
          classList={{
            outline: props.searcher.options.isCurrentPageOnly,
          }}
          onClick={() => props.searcher.toggle('isCurrentPageOnly')}
        >
          <StickyNoteIcon />
        </button>
      </div>
    </div>
  );
}
