import { createMemo, Show } from 'solid-js';
import assert from 'assert';

import type BaseEditor from '#domain/client/app/model/note/editor/BaseEditor';
import MarkdownEditor from '#domain/client/app/model/note/editor/MarkdownEditor';
import UnknownEditor from '#domain/client/app/model/note/editor/UnknownEditor';
import PdfEditor from '#domain/client/app/model/note/editor/PdfEditor';

import MarkdownEditorView from './MarkdownEditor';
import UnknownEditorView from './UnknownEditor';
import PdfEditorView from './PdfEditor';
import Breadcrumbs from './Breadcrumbs';
import TitleInput from './TitleInput';
import ErrorEditor from './ErrorEditor';

export default function Editor(props: { editor: BaseEditor }) {
  const isError = createMemo(() => props.editor.value.result.isError);
  const editor = createMemo(() => {
    if (isError()) {
      return <ErrorEditor editor={props.editor} />;
    }

    if (props.editor instanceof UnknownEditor) {
      return <UnknownEditorView />;
    } else if (props.editor instanceof PdfEditor) {
      return <PdfEditorView editor={props.editor} />;
    } else if (props.editor instanceof MarkdownEditor) {
      return <MarkdownEditorView editor={props.editor} />;
    } else {
      assert('invalid editor');
    }
  });

  return (
    <div class="flex flex-col h-full" onFocusIn={() => props.editor.focus()}>
      <Show when={!isError()}>
        <TitleInput editor={props.editor} />
        <Breadcrumbs editor={props.editor} />
      </Show>
      {editor()}
    </div>
  );
}
