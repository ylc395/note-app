import assert from 'assert';
import { createMemo, Show } from 'solid-js';
import MarkdownEditor from '#domain/client/app/model/Workbench/noteEditor/MarkdownEditor';

import LocalFileUploader from './LocalFileUploader';
import RemoteFileUploader from './RemoteFileUploader';
import { useContext } from '../../composables';

enum Mode {
  Remote = 1,
  Local,
}

export default function Empty() {
  const editor = createMemo(() => {
    const { editor } = useContext()!;
    assert(editor instanceof MarkdownEditor);

    return editor;
  });

  const mode = createMemo(() => {
    if (editor().resourceManager?.downloader) {
      return Mode.Remote;
    }

    if (editor().resourceManager?.file) {
      return Mode.Local;
    }

    return null;
  });

  function shouldShow(v: Mode) {
    return !mode() || mode() === v;
  }

  return (
    <div class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-fg-tertiary">
      <Show when={mode() === null}>
        <h1 class="mb-6">直接开始输入，或...</h1>
      </Show>
      <div class="flex space-x-12">
        <Show when={shouldShow(Mode.Local)}>
          <LocalFileUploader />
        </Show>
        <Show when={shouldShow(Mode.Remote)}>
          <RemoteFileUploader />
        </Show>
      </div>
    </div>
  );
}
