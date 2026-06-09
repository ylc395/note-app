import { createMemo, createSignal, Show } from 'solid-js';
import assert from 'assert';
import { action } from 'mobx';

import BaseMarkdownEditor from '#web/view/components/MarkdownEditor';
import MarkdownEditor from '#domain/client/app/model/Workbench/noteEditor/MarkdownEditor';
import type Editor from '#web/view/components/MarkdownEditor/Editor';

import { useContext, useEditorBody } from '../composables';
import Empty from './Empty';
import Button from '#web/view/components/Button';
import { FullscreenIcon, ListIcon, SearchIcon } from 'lucide-solid';

export default function MarkdownEditorView() {
  const [getEditor, setEditor] = createSignal<Editor>();
  const editor = createMemo(() => {
    const { editor } = useContext()!;
    assert(editor instanceof MarkdownEditor);

    return editor;
  });

  const { updateBody } = useEditorBody(getEditor);

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
        <div class="flex py-2 pl-2 pr-4 border-b border-border-secondary">
          <Button size="small">
            <SearchIcon />
            查找
          </Button>
          <Button size="small">
            <ListIcon />
            大纲
          </Button>
          <Button size="small">
            <FullscreenIcon />
            全屏
          </Button>
        </div>
        <BaseMarkdownEditor
          ref={setEditor}
          className="h-full overflow-auto border-16 border-bg-primary"
          defaultValue={editor().content}
          initialScroll={editor().uiState!.scroll}
          initialCursorPos={editor().uiState!.cursorPos}
          readonly={editor().isUploading}
          onUpdate={updateBody}
          onScrollEnd={action(handleScrollEnd)}
          onSelectionUpdate={action(handleSelectionUpdate)}
        />
        <Show when={!editor().content}>
          <Empty />
        </Show>
      </div>
    </Show>
  );
}
