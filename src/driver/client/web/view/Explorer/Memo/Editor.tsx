import type Editor from '#domain/client/app/model/memo/Editor';
import { Editable } from '@ark-ui/solid';

export default function EditorView({ editor }: { editor: Editor }) {
  return (
    <Editable.Root edit submitMode="none" onValueChange={(e) => editor.update(e.value)}>
      <Editable.Area>
        <Editable.Input value={editor.value} />
      </Editable.Area>
      <Editable.Control>
        <Editable.SubmitTrigger onClick={editor.submit.bind(editor)} disabled={!editor.canSubmit}>
          submit
        </Editable.SubmitTrigger>
      </Editable.Control>
    </Editable.Root>
  );
}
