import { CheckIcon, XIcon } from 'lucide-solid';
import { onMount } from 'solid-js';
import assert from 'assert';

import type NewNoteForm from '#domain/client/app/model/note/TreeView/NewNoteForm';

export default function TitleEditor(props: { editor: NewNoteForm }) {
  let inputRef: HTMLInputElement | undefined;

  onMount(() => {
    assert(inputRef);

    inputRef.value = props.editor.value.title || '';
    setTimeout(() => inputRef?.focus()); // ark-ui menu 在被关闭的时候会 focus 一下 trigger button。我们需要重新 focus 下这个
  });

  return (
    <div class="flex">
      <input onInput={(e) => props.editor.setTitle(e.target.value)} ref={inputRef} />
      <div>
        <button onClick={() => props.editor.submit()}>
          <CheckIcon />
        </button>
        <button onClick={() => props.editor.cancel()}>
          <XIcon />
        </button>
      </div>
    </div>
  );
}
