import { createEffect, createSignal, on, Show } from 'solid-js';
import assert from 'assert';
import { action } from 'mobx';

import Workbench from '#domain/client/app/model/Workbench';
import container from '#utils/singletonContainer';
import BaseMarkdownEditor from '#web/components/MarkdownEditor';
import MarkdownEditor from '#domain/client/app/model/note/editor/MarkdownEditor';
import type Editor from '#web/components/MarkdownEditor/Editor';

import { useContext } from '../context';
import Empty from './Empty';

export default function MarkdownEditorView() {
  const [getCrepe, setCrepe] = createSignal<Editor>();
  const workbench = container.resolve(Workbench);
  const { editor } = useContext()!;

  assert(editor instanceof MarkdownEditor);

  // 其他编辑器改动内容时，本编辑器同步更新
  createEffect(
    on(
      () => editor.value.result.data?.body,
      (body) => {
        const mdEditor = getCrepe();
        if (
          mdEditor?.isCreated &&
          typeof body === 'string' &&
          workbench.currentEditor &&
          workbench.currentEditor !== editor
        ) {
          mdEditor.replaceContent(body);
        }
      },
    ),
  );

  function onUpdate(text: string) {
    if (workbench.currentEditor === editor) {
      editor.update({ body: text });
    }
  }

  function handleScrollEnd(e: { x: number; y: number }) {
    assert(editor instanceof MarkdownEditor);

    if (editor.uiState) {
      editor.uiState.scroll = e;
    }
  }

  return (
    <Show when={editor.isReady}>
      <div class="min-h-0 grow overflow-hidden">
        <BaseMarkdownEditor
          ref={setCrepe}
          className="h-full overflow-auto border-16 border-surface-primary"
          defaultValue={editor.value.result.data!.body}
          initialScroll={editor.uiState!.scroll}
          readonly={editor.isUploading}
          onUpdate={onUpdate}
          onScrollEnd={action(handleScrollEnd)}
        />
        <Show when={!editor.value.result.data!.body}>
          <Empty />
        </Show>
      </div>
    </Show>
  );
}
