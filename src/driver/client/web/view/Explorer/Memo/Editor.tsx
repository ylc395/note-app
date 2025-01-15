import type Editor from '#domain/client/app/model/memo/Editor';
import MarkdownEditor from '#web/components/MarkdownEditor';

export default function EditorView({ editor }: { editor: Editor }) {
  return (
    <div class="w-full">
      <MarkdownEditor defaultValue={editor.initialValue} onUpdate={editor.update.bind(editor)} />
      <div>
        <button disabled={!editor.canSubmit} onclick={editor.submit.bind(editor)}>
          submit
        </button>
      </div>
    </div>
  );
}
