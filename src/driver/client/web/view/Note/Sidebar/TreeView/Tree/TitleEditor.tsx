import { CheckIcon, XIcon } from 'lucide-solid';
import { onMount } from 'solid-js';

import type NewNoteEditor from '#domain/client/app/model/note/TreeView/NewNoteEditor';

export default function TitleEditor(props: { editor: NewNoteEditor }) {
  let inputRef: HTMLInputElement | undefined;

  onMount(() => inputRef?.focus());

  return (
    <div class="flex">
      <input ref={inputRef} />
      <div>
        <button onClick={() => props.editor.submit(inputRef!.value)}>
          <CheckIcon />
        </button>
        <button onClick={() => props.editor.cancel()}>
          <XIcon />
        </button>
      </div>
    </div>
  );
}
