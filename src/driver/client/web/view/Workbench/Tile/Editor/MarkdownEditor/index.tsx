import { createEffect, createSignal, on, Show } from 'solid-js';

import type BaseEditor from '#domain/client/app/model/note/editor/BaseEditor';
import Workbench from '#domain/client/app/model/Workbench';
import container from '#utils/singletonContainer';
import BaseMarkdownEditor from '#web/components/MarkdownEditor';
import type Editor from '#web/components/MarkdownEditor/Editor';

export default function MarkdownEditor(props: { editor: BaseEditor }) {
  const [getCrepe, setCrepe] = createSignal<Editor>();
  const workbench = container.resolve(Workbench);

  createEffect(
    on(
      () => props.editor.value.result.data?.body,
      (body) => {
        if (typeof body === 'string' && workbench.currentEditor && workbench.currentEditor !== props.editor) {
          getCrepe()?.replaceContent(body);
        }
      },
    ),
  );

  return (
    <Show when={props.editor.value.result.data}>
      {(note) => (
        <BaseMarkdownEditor
          ref={setCrepe}
          containerClass="grow min-h-0 overflow-auto border-16 border-surface-primary"
          defaultValue={note().body}
          onUpdate={(text) => props.editor.update({ body: text })}
        />
      )}
    </Show>
  );
}
