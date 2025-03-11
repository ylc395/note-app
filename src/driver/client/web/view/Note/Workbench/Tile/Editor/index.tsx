import type BaseEditor from '#domain/client/app/model/note/editor/BaseEditor';
import UnknownEditor from '#domain/client/app/model/note/editor/UnknownEditor';
import PdfEditor from '#domain/client/app/model/note/editor/PdfEditor';

import MarkdownEditorView from './MarkdownEditor';
import UnknownEditorView from './UnknownEditor';
import PdfEditorView from './PdfEditor';

export default function Editor(props: { editor: BaseEditor }) {
  if (props.editor instanceof UnknownEditor) {
    return <UnknownEditorView />;
  }

  if (props.editor instanceof PdfEditor) {
    return <PdfEditorView editor={props.editor} />;
  }

  return <MarkdownEditorView editor={props.editor} />;
}
