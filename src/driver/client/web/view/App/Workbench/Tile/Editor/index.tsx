import { createMemo, Match, Show, Switch } from 'solid-js';

import type BaseEditor from '#domain/client/app/model/Workbench/BaseEditor';
import MarkdownEditor from '#domain/client/app/model/Workbench/noteEditor/MarkdownEditor';
import UnknownEditor from '#domain/client/app/model/Workbench/noteEditor/UnknownEditor';
import PdfEditor from '#domain/client/app/model/Workbench/noteEditor/PdfEditor';
import HtmlEditor from '#domain/client/app/model/Workbench/noteEditor/HtmlEditor';
import NoteBaseEditor from '#domain/client/app/model/Workbench/noteEditor/BaseEditor';

import MarkdownEditorView from './MarkdownEditor';
import UnknownEditorView from './UnknownEditor';
import PdfEditorView from './PdfEditor';
import HtmlEditorView from './HtmlEditor';
import Meta from './MetaBar';
import TitleInput from './TitleInput';
import Error from './Error';
import PreviewTip from './PreviewTip';
import { ContextProvider } from './composables';

export default function Editor(props: { editor: BaseEditor }) {
  const isError = createMemo(() => props.editor.entity.value.result.isError);

  return (
    <ContextProvider editor={props.editor}>
      <div class="flex flex-col h-full relative" onFocusIn={() => props.editor.focus()}>
        <Show when={!isError()} fallback={<Error />}>
          <TitleInput />
          <Meta />
          <Switch>
            <Match when={props.editor instanceof UnknownEditor}>
              <UnknownEditorView />
            </Match>
            <Match when={props.editor instanceof PdfEditor}>
              <PdfEditorView />
            </Match>
            <Match when={props.editor instanceof HtmlEditor}>
              <HtmlEditorView />
            </Match>
            <Match when={props.editor instanceof MarkdownEditor}>
              <MarkdownEditorView />
            </Match>
          </Switch>
          <Show when={props.editor instanceof NoteBaseEditor && props.editor.isTemp}>
            <PreviewTip />
          </Show>
        </Show>
      </div>
    </ContextProvider>
  );
}
