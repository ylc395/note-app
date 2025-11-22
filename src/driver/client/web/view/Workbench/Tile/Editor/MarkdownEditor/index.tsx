import { createEffect, createSignal, on, Show } from 'solid-js';

import Workbench from '#domain/client/app/model/Workbench';
import container from '#utils/singletonContainer';
import BaseMarkdownEditor from '#web/components/MarkdownEditor';
import type Editor from '#web/components/MarkdownEditor/Editor';

import { useContext } from '../context';

export default function MarkdownEditor() {
  const [getCrepe, setCrepe] = createSignal<Editor>();
  const workbench = container.resolve(Workbench);
  const ctx = useContext()!;

  createEffect(
    on(
      () => ctx.editor.value.result.data?.body,
      (body) => {
        if (typeof body === 'string' && workbench.currentEditor && workbench.currentEditor !== ctx.editor) {
          getCrepe()?.replaceContent(body);
        }
      },
    ),
  );

  return (
    <Show when={ctx.editor.value.result.data}>
      {(note) => (
        <BaseMarkdownEditor
          ref={setCrepe}
          className="grow min-h-0 overflow-auto border-16 border-surface-primary"
          defaultValue={note().body}
          onUpdate={(text) => ctx.editor.update({ body: text })}
        />
      )}
    </Show>
  );
}
