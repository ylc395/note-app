import { createEffect, createSignal, on, Show } from 'solid-js';
import assert from 'assert';

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

  createEffect(
    on(
      () => editor.value.result.data?.body,
      (body) => {
        if (typeof body === 'string' && workbench.currentEditor && workbench.currentEditor !== editor) {
          getCrepe()?.replaceContent(body);
        }
      },
    ),
  );

  return (
    <Show when={editor.value.result.data}>
      {(note) => (
        <div class="relative min-h-0 grow">
          <BaseMarkdownEditor
            ref={setCrepe}
            className="grow min-h-0 overflow-auto border-16 border-surface-primary"
            defaultValue={note().body}
            readonly={editor.isUploading}
            onUpdate={(text) => editor.isCurrent && editor.update({ body: text })}
          />
          <Show when={!note().body}>
            <Empty />
          </Show>
        </div>
      )}
    </Show>
  );
}
