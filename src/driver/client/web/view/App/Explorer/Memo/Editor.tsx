import { createSignal, Show } from 'solid-js';
import { SendHorizontalIcon, RotateCcwIcon } from 'lucide-solid';
import assert from 'assert';
import { action } from 'mobx';

import MarkdownEditor from '#web/view/components/MarkdownEditor';
import MarkdownEditorModel from '#web/view/components/MarkdownEditor/Editor';
import Button from '#web/view/components/Button';
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

  function cancel() {
    assert(props.memo);
    props.memo.uiState.isEditing = false;
  }

  return (
    <div
      class="rounded-lg overflow-hidden shrink-0"
      classList={{
        'border border-border-primary bg-bg-primary': !props.isReadonly,
      }}
    >
      <MarkdownEditor
        className={props.isReadonly ? '' : 'min-h-24 p-3'}
        onUpdate={onUpdate}
        ref={setMarkdownEditor}
        readonly={props.isReadonly}
        defaultValue={memoEditor.value}
      />
      <Show when={!props.isReadonly}>
        <div class="flex justify-between items-center border-t border-border-secondary px-3 py-2">
          <div class="text-xs text-fg-tertiary">字数 {memoEditor.value.length}</div>
          <div class="flex items-center gap-1">
            <Show when={props.appendMemo}>
              <Button size="small" onClick={reset}>
                <RotateCcwIcon />
                重置
              </Button>
              <Button intent="primary" square size="small" disabled={!memoEditor.canSubmit} onClick={submit}>
                <SendHorizontalIcon />
              </Button>
            </Show>
            <Show when={props.memo}>
              <Button size="small" onClick={action(cancel)}>
                取消
              </Button>
              <Button size="small" onClick={submit}>
                保存
              </Button>
            </Show>
          </div>
        </div>
      </Show>
    </div>
  );
}
