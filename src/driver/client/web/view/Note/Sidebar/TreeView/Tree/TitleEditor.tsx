import { CheckIcon, XIcon } from 'lucide-solid';
import { onMount } from 'solid-js';

import type NewNoteEditor from '#domain/client/app/model/note/TreeView/NewNoteEditor';

export default function TitleEditor(props: { editor: NewNoteEditor }) {
  let inputRef: HTMLInputElement | undefined;

  onMount(() => {
    setTimeout(() => inputRef?.focus()); // ark-ui menu 在被关闭的时候会 focus 一下 trigger button。我们需要重新 focus 下这个
  });

  return (
    <div class="flex">
      <input ref={inputRef} />
      <div>
        <button onClick={() => props.editor.submit(inputRef!.value)}>
          <CheckIcon />
        </button>
        <button onClick={() => props.editor.reset()}>
          <XIcon />
        </button>
      </div>
    </div>
  );
}
