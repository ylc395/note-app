import { createMemo, Match, Show, Switch } from 'solid-js';

import type BaseEditor from '#domain/client/app/model/note/editor/BaseEditor';
import MarkdownEditor from '#domain/client/app/model/note/editor/MarkdownEditor';
import UnknownEditor from '#domain/client/app/model/note/editor/UnknownEditor';
import PdfEditor from '#domain/client/app/model/note/editor/PdfEditor';

import MarkdownEditorView from './MarkdownEditor';
import UnknownEditorView from './UnknownEditor';
import PdfEditorView from './PdfEditor';
import Breadcrumbs from './Breadcrumbs';
import TitleInput from './TitleInput';
import Error from './Error';
import { ContextProvider } from './context';

export default function Editor(props: { editor: BaseEditor }) {
  const isError = createMemo(() => props.editor.value.result.isError);

  return (
    <ContextProvider editor={props.editor}>
      <div class="flex flex-col h-full relative" onFocusIn={() => props.editor.focus()}>
        <Show when={!isError()}>
          <TitleInput />
          <Breadcrumbs />
        </Show>
        <Switch>
          <Match when={isError()}>
            <Error />
          </Match>
          <Match when={props.editor instanceof UnknownEditor}>
            <UnknownEditorView />
          </Match>
          <Match when={props.editor instanceof PdfEditor}>
            <PdfEditorView />
          </Match>
          <Match when={props.editor instanceof MarkdownEditor}>
            <MarkdownEditorView />
          </Match>
        </Switch>
      </div>
    </ContextProvider>
  );
}
