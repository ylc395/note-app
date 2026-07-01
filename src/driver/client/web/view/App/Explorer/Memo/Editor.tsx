import { createSignal, Show } from 'solid-js';
import { SendHorizontalIcon } from 'lucide-solid';
import assert from 'assert';

import MarkdownEditor from '#web/view/components/MarkdownEditor';
import MarkdownEditorModel from '#web/view/components/MarkdownEditor/Editor';
import MemoEditor from '#domain/client/app/model/memo/Editor';
import type Memo from '#domain/client/app/model/memo/Memo';
import type MemoList from '#domain/client/app/model/memo/List';

export default function EditorView(props: { memo?: Memo; isReadonly?: boolean; appendMemo?: Memo | MemoList }) {
  const onSubmit = props.appendMemo?.createNewMemo || props.memo?.update;
  assert(onSubmit);

  const memoEditor = new MemoEditor({
    initialValue: props.memo?.value.body,
    onSubmit,
  });

  const [markdownEditor, setMarkdownEditor] = createSignal<MarkdownEditorModel>();

  function reset() {
    markdownEditor()?.replaceContent(props.appendMemo ? '' : props.memo?.value.body ?? '');
    markdownEditor()?.focus();
  }

  async function submit() {
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
        ref={setMarkdownEditor}
        readonly={props.isReadonly}
        defaultValue={memoEditor.value}
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
              onclick={submit}
            >
              <SendHorizontalIcon />
            </button>
          </div>
        </div>
      </Show>
    </div>
  );
}
