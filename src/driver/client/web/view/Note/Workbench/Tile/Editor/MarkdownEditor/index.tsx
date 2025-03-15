import type { Crepe } from '@milkdown/crepe';
import { replaceAll } from '@milkdown/kit/utils';
import { createEffect, createSignal, on, Show } from 'solid-js';

import type BaseEditor from '#domain/client/app/model/note/editor/BaseEditor';
import Workbench from '#domain/client/app/model/Workbench';
import { container } from '#domain/shared/infra/singletons';
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
          containerClass="grow *:h-full"
          editorRootClass="h-full p-2"
          defaultValue={note().body}
          onUpdate={(text) => props.editor.update({ body: text })}
        />
      )}
    </Show>
  );
}
