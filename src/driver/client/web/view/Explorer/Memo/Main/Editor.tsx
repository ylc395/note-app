import { createSignal } from 'solid-js';
import { SendHorizontalIcon } from 'lucide-solid';
import type { Crepe } from '@milkdown/crepe';
import { replaceAll } from '@milkdown/kit/utils';
import { editorViewCtx } from '@milkdown/kit/core';

import type Editor from '#domain/client/app/model/memo/Editor';
import MarkdownEditor from '#web/components/MarkdownEditor';

export default function EditorView(props: { editor: Editor }) {
  const editor = props.editor;
  const [getCrepe, setCrepe] = createSignal<Crepe>();

  function reset() {
    const crepe = getCrepe()!;
    crepe.editor.action(replaceAll('', true));
    crepe.editor.action((ctx) => ctx.get(editorViewCtx).focus());
  }

  async function onSubmit() {
    await editor.submit();
    reset();
  }

  return (
    <div class="w-full border mx-auto rounded-lg ">
      <MarkdownEditor
        defaultValue={editor.initialValue}
        onUpdate={editor.update.bind(editor)}
        onCreated={setCrepe}
        rootClass="!p-4 max-h-96 min-h-32 overflow-y-auto"
      />
      <div class="flex justify-between border-t">
        <div>字数{editor.value.length}</div>
        <div class="flex space-x-2">
          <button onclick={reset} class="text-gray-400">
            重置
          </button>
          <button
            class="rounded-md cursor-pointer bg-blue-100 w-12 h-8 flex items-center justify-center"
            disabled={!editor.canSubmit}
            onclick={onSubmit}
          >
            <SendHorizontalIcon />
          </button>
        </div>
      </div>
    </div>
  );
}
