import { CheckIcon, XIcon } from 'lucide-solid';
import { onMount } from 'solid-js';
import assert from 'assert';

import type NewNoteForm from '#domain/client/app/model/note/TreeView/NewNoteForm';

export default function TitleEditor(props: { newNoteForm: NewNoteForm }) {
  let inputRef: HTMLInputElement | undefined;
  const btnClassName = 'button button-square-tiny';

  onMount(() => {
    assert(inputRef);

    inputRef.value = props.newNoteForm.value.title || '';
    setTimeout(() => inputRef?.focus()); // ark-ui menu 在被关闭的时候会 focus 一下 trigger button。我们需要重新 focus 下这个
  });

  return (
    <div class="flex grow overflow-hidden min-w-0 bg-surface-primary rounded-md items-center border-border-primary border">
      <input
        class="px-inset-squish min-w-0 grow"
        spellcheck="false"
        onInput={(e) => props.newNoteForm.setTitle(e.target.value)}
        ref={inputRef}
      />
      <div class="flex items-center">
        <button class={btnClassName} onClick={() => props.newNoteForm.submit()}>
          <CheckIcon />
        </button>
        <button class={btnClassName} onClick={() => props.newNoteForm.cancel()}>
          <XIcon />
        </button>
      </div>
    </div>
  );
}
