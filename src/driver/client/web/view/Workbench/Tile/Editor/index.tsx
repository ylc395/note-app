import { createMemo, Match, Show, Switch } from 'solid-js';

import type BaseEditor from '#domain/client/app/model/note/editor/BaseEditor';
import MarkdownEditor from '#domain/client/app/model/note/editor/MarkdownEditor';
import UnknownEditor from '#domain/client/app/model/note/editor/UnknownEditor';
import PdfEditor from '#domain/client/app/model/note/editor/PdfEditor';
import HtmlEditor from '#domain/client/app/model/note/editor/HtmlEditor';

import MarkdownEditorView from './MarkdownEditor';
import UnknownEditorView from './UnknownEditor';
import PdfEditorView from './PdfEditor';
import HtmlEditorView from './HtmlEditor';
import Breadcrumbs from './Breadcrumbs';
import TitleInput from './TitleInput';
import Error from './Error';
import PreviewTip from './PreviewTip';
import { ContextProvider } from './context';

export default function Editor(props: { editor: BaseEditor }) {
  const isError = createMemo(() => props.editor.value.result.isError);

  return (
    <ContextProvider editor={props.editor}>
      <div class="flex flex-col h-full relative" onFocusIn={() => props.editor.focus()}>
        <Show when={!isError()} fallback={<Error />}>
          <TitleInput />
          <Breadcrumbs />
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
          <Show when={props.editor.isPreview}>
            <PreviewTip />
          </Show>
        </Show>
      </div>
    </ContextProvider>
  );
}
