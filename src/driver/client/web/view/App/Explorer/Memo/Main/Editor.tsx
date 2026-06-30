import { createSignal, Show } from 'solid-js';
import { SendHorizontalIcon } from 'lucide-solid';

import MarkdownEditor from '#web/view/components/MarkdownEditor';
import MarkdownEditorModel from '#web/view/components/MarkdownEditor/Editor';
import MemoEditor from '#domain/client/app/model/memo/Editor';
import type Memo from '#domain/client/app/model/memo/Memo';

import { useContext } from '../context';

export default function EditorView(props: { memo?: Memo; isReadonly?: boolean }) {
  const { memoList } = useContext()!;

  const memoEditor = new MemoEditor({
    onSubmit: props.memo ? props.memo.update : memoList.createNewMemo,
    initialValue: props.memo?.value.body,
  });

  const [getCrepe, setCrepe] = createSignal<MarkdownEditorModel>();

  function reset() {
    const crepe = getCrepe()!;
    crepe.replaceContent(props.memo?.value.body ?? '');
    crepe.focus();
  }

  async function onSubmit() {
    await memoEditor.submit.mutate();
    reset();
  }

  function onUpdate(text: string) {
    memoEditor.update(text);
  }

  return (
    <div class="border rounded-lg">
      <MarkdownEditor
        onUpdate={onUpdate}
        ref={setCrepe}
        readonly={props.isReadonly}
        defaultValue={props.memo?.value.body}
      />
      <Show when={!props.isReadonly}>
        <div class="flex justify-between border-t">
          <div class="text-sm flex items-center px-2 text-fg-tertiary">字数{memoEditor.value.length}</div>
          <div class="flex space-x-2">
            <button onclick={reset} class="text-fg-tertiary">
              重置
            </button>
            <button
              class="rounded-md cursor-pointer bg-bg-active text-fg-accent w-12 h-8 flex items-center justify-center"
              disabled={!memoEditor.canSubmit}
              onclick={onSubmit}
            >
              <SendHorizontalIcon />
            </button>
          </div>
        </div>
      </Show>
    </div>
  );
}
