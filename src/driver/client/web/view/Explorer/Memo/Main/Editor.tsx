import { createSignal } from 'solid-js';
import { SendHorizontalIcon } from 'lucide-solid';

import type Editor from '#domain/client/app/model/memo/Editor';
import MarkdownEditor from '#web/components/MarkdownEditor';
import MarkdownEditorModel from '#web/components/MarkdownEditor/Editor';

export default function EditorView(props: { editor: Editor }) {
  const [getCrepe, setCrepe] = createSignal<MarkdownEditorModel>();

  function reset() {
    const crepe = getCrepe()!;
    crepe.replaceContent('');
    crepe.focus();
  }

  async function onSubmit() {
    await props.editor.submit();
    reset();
  }

  function onUpdate(text: string) {
    props.editor.update(text);
  }

  return (
    <div class="border rounded-lg">
      <MarkdownEditor onUpdate={onUpdate} ref={setCrepe} />
      <div class="flex justify-between border-t">
        <div class="text-sm flex items-center px-2 text-gray-400">字数{props.editor.value.length}</div>
        <div class="flex space-x-2">
          <button onclick={reset} class="text-gray-400">
            重置
          </button>
          <button
            class="rounded-md cursor-pointer bg-gray-300 text-white w-12 h-8 flex items-center justify-center"
            disabled={!props.editor.canSubmit}
            onclick={onSubmit}
          >
            <SendHorizontalIcon />
          </button>
        </div>
      </div>
    </div>
  );
}
