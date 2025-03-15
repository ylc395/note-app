import { createMemo } from 'solid-js';

import type BaseEditor from '#domain/client/app/model/note/editor/BaseEditor';
import UnknownEditor from '#domain/client/app/model/note/editor/UnknownEditor';
import PdfEditor from '#domain/client/app/model/note/editor/PdfEditor';

import MarkdownEditorView from './MarkdownEditor';
import UnknownEditorView from './UnknownEditor';
import PdfEditorView from './PdfEditor';
import Breadcrumbs from './Breadcrumbs';
import TitleInput from './TitleInput';

export default function Editor(props: { editor: BaseEditor }) {
  const editor = createMemo(() => {
    if (props.editor instanceof UnknownEditor) {
      return <UnknownEditorView />;
    } else if (props.editor instanceof PdfEditor) {
      return <PdfEditorView editor={props.editor} />;
    } else {
      return <MarkdownEditorView editor={props.editor} />;
    }
  });

  return (
    <div class="flex flex-col h-full" onFocusIn={() => props.editor.focus()}>
      <TitleInput editor={props.editor} />
      <Breadcrumbs editor={props.editor} />
      {editor()}
    </div>
  );
}
