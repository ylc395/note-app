import type BaseEditor from '#domain/client/app/model/note/editor/BaseEditor';
import BaseMarkdownEditor from '#web/components/MarkdownEditor';
import { Show } from 'solid-js';

export default function MarkdownEditor(props: { editor: BaseEditor }) {
  return (
    <Show when={props.editor} keyed>
      <Show when={props.editor.value.result.data}>
        {(note) => (
          <BaseMarkdownEditor
            containerClass="grow *:h-full"
            editorRootClass="h-full p-2"
            defaultValue={note().body}
            onUpdate={(text) => props.editor.update({ body: text })}
          />
        )}
      </Show>
    </Show>
  );
}
