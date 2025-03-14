import type BaseEditor from '#domain/client/app/model/note/editor/BaseEditor';
import UnknownEditor from '#domain/client/app/model/note/editor/UnknownEditor';
import PdfEditor from '#domain/client/app/model/note/editor/PdfEditor';

import MarkdownEditorView from './MarkdownEditor';
import UnknownEditorView from './UnknownEditor';
import PdfEditorView from './PdfEditor';
import TitleInput from './TitleInput';

export default function Editor(props: { editor: BaseEditor }) {
  let editor;

  if (props.editor instanceof UnknownEditor) {
    editor = <UnknownEditorView />;
  } else if (props.editor instanceof PdfEditor) {
    editor = <PdfEditorView editor={props.editor} />;
  } else {
    editor = <MarkdownEditorView editor={props.editor} />;
  }

  return (
    <div class="flex flex-col h-full" onFocusIn={() => props.editor.focus()}>
      <TitleInput editor={props.editor} />
      {editor}
    </div>
  );
}
