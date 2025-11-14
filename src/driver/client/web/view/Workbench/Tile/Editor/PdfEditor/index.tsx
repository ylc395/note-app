import { createEffect, createMemo, Show } from 'solid-js';
import { Splitter, useSplitter } from '@ark-ui/solid';

import type PdfEditor from '#domain/client/app/model/note/editor/PdfEditor';

import AnnotationList from './AnnotationList';
import PdfView from './PdfView';
import BodyEditor from './BodyEditor';

enum Panel {
  Body = 'body',
  Pdf = 'pdf',
  Annotation = 'annotation',
}

export default function PdfEditorView(props: { editor: PdfEditor }) {
  const isAnnotationVisible = createMemo(() => {
    return props.editor.annotation.state.isReady && props.editor.annotation.state.get('panelVisible');
  });

  const splitter = useSplitter({ panels: [{ id: Panel.Body }, { id: Panel.Pdf }, { id: Panel.Annotation }] });

  createEffect(() => {
    if (!isAnnotationVisible()) {
      const sizes = splitter().getSizes();
      splitter().setSizes([...sizes.slice(0, 2), 0]);
    }
  });

  return (
    <Splitter.RootProvider value={splitter} class="grow flex min-h-0">
      <Splitter.Panel id={Panel.Body}>
        <BodyEditor editor={props.editor} />
      </Splitter.Panel>
      <Splitter.ResizeTrigger class="w-1" id={`${Panel.Body}:${Panel.Pdf}`} />
      <Splitter.Panel id={Panel.Pdf} asChild={(childProps) => <PdfView editor={props.editor} {...childProps()} />} />
      <Splitter.ResizeTrigger class="w-1" id={`${Panel.Pdf}:${Panel.Annotation}`} />
      <Splitter.Panel
        id={Panel.Annotation}
        asChild={(childProps) => (
          <Show when={isAnnotationVisible()}>
            <AnnotationList editor={props.editor} {...childProps()} />
          </Show>
        )}
      />
    </Splitter.RootProvider>
  );
}
