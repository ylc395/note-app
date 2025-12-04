import assert from 'assert';
import { createEffect, createMemo, Show } from 'solid-js';
import MarkdownEditor from '#domain/client/app/model/note/editor/MarkdownEditor';

import LocalFileUploader from './LocalFileUploader';
import RemoteFileUploader from './RemoteFileUploader';
import { useContext } from '../../context';

enum Mode {
  Remote = 1,
  Local,
}

export default function Empty() {
  const buttonClassName = 'pointer-events-auto border-border-primary border border-dashed p-18 rounded-3xl';
  const { editor } = useContext()!;

  const mode = createMemo(() => {
    if (editor.fileUploader?.downloader) {
      return Mode.Remote;
    }

    if (editor.fileUploader?.file) {
      return Mode.Local;
    }

    return null;
  });

  function shouldShow(v: Mode) {
    return !mode() || mode() === v;
  }

  assert(editor instanceof MarkdownEditor);

  return (
    <div class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none opacity-40">
      <Show when={mode() === null}>
        <h1 class="mb-stack-lg">直接开始输入，或...</h1>
      </Show>
      <div class="flex space-x-12">
        <Show when={shouldShow(Mode.Local)}>
          <LocalFileUploader className={buttonClassName} />
        </Show>
        <Show when={shouldShow(Mode.Remote)}>
          <RemoteFileUploader className={buttonClassName} />
        </Show>
      </div>
    </div>
  );
}
