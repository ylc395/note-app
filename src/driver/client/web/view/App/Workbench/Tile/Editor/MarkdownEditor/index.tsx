import { createMemo, createSignal, Show } from 'solid-js';
import assert from 'assert';
import { action } from 'mobx';

import BaseMarkdownEditor from '#web/view/components/MarkdownEditor';
import MarkdownEditor from '#domain/client/app/model/note/editor/MarkdownEditor';
import type Editor from '#web/view/components/MarkdownEditor/Editor';

import { useContext, useEditorBody } from '../composables';
import Empty from './Empty';

export default function MarkdownEditorView() {
  const [getEditor, setEditor] = createSignal<Editor>();
  const editor = createMemo(() => {
    const { editor } = useContext()!;
    assert(editor instanceof MarkdownEditor);

    return editor;
  });

  const { onUpdate } = useEditorBody(getEditor);

  function handleScrollEnd(e: { x: number; y: number }) {
    if (editor().uiState) {
      editor().uiState!.scroll = e;
    }
  }

  function handleSelectionUpdate(pos: { anchor: number; head: number }) {
    if (editor().uiState) {
      editor().uiState!.cursorPos = pos;
    }
  }

  return (
    <Show when={editor().isReady}>
      <div class="min-h-0 grow overflow-hidden">
        <BaseMarkdownEditor
          ref={setEditor}
          className="h-full overflow-auto border-16 border-bg-primary"
          defaultValue={editor().source.value.data!.body}
          initialScroll={editor().uiState!.scroll}
          initialCursorPos={editor().uiState!.cursorPos}
          readonly={editor().isUploading}
          onUpdate={onUpdate}
          onScrollEnd={action(handleScrollEnd)}
          onSelectionUpdate={action(handleSelectionUpdate)}
        />
        <Show when={!editor().source.value.data!.body}>
          <Empty />
        </Show>
      </div>
    </Show>
  );
}
