import type { Crepe } from '@milkdown/crepe';
import { replaceAll } from '@milkdown/kit/utils';
import { createEffect, createSignal, on, Show } from 'solid-js';

import type BaseEditor from '#domain/client/app/model/note/editor/BaseEditor';
import Workbench from '#domain/client/app/model/Workbench';
import container from '#utils/singletonContainer';
import BaseMarkdownEditor from '#web/components/MarkdownEditor';

export default function MarkdownEditor(props: { editor: BaseEditor }) {
  const [getCrepe, setCrepe] = createSignal<Crepe>();
  const workbench = container.resolve(Workbench);

  createEffect(
    on(
      () => props.editor.value.result.data?.body,
      (body) => {
        if (typeof body === 'string' && workbench.currentEditor !== props.editor) {
          getCrepe()?.editor.action(replaceAll(body));
        }
      },
    ),
  );

  return (
    <Show when={props.editor.value.result.data}>
      {(note) => (
        <BaseMarkdownEditor
          ref={setCrepe}
          containerClass="grow min-h-0 overflow-auto"
          editorRootClass="!p-8"
          defaultValue={note().body}
          onUpdate={(text) => props.editor.update({ body: text })}
        />
      )}
    </Show>
  );
}
