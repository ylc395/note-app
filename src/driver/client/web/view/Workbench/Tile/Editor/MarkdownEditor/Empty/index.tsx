import assert from 'assert';
import { Show } from 'solid-js';
import MarkdownEditor from '#domain/client/app/model/note/editor/MarkdownEditor';

import LocalFileUploader from './LocalFileUploader';
import RemoteFileUploader from './RemoteFileUploader';
import { useContext } from '../../context';

export default function Empty() {
  const buttonClassName = 'pointer-events-auto border-border-primary border border-dashed p-18 rounded-3xl';
  const { editor } = useContext()!;

  assert(editor instanceof MarkdownEditor);

  return (
    <div class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none opacity-40">
      <Show when={!editor.isUploading}>
        <h1 class="mb-stack-lg">直接开始输入，或...</h1>
      </Show>
      <div class="flex space-x-12">
        <Show when={!editor.remoteUploader}>
          <LocalFileUploader className={buttonClassName} />
        </Show>
        <Show when={!editor.localUploader}>
          <RemoteFileUploader className={buttonClassName} />
        </Show>
      </div>
    </div>
  );
}
