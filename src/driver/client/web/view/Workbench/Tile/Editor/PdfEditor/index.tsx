import { createMemo, Show } from 'solid-js';
import { Splitter, type SplitterResizeDetails } from '@ark-ui/solid';
import { action } from 'mobx';
import { compact, sum, zipObject } from 'lodash-es';
import assert from 'assert';

import PdfEditor from '#domain/client/app/model/note/editor/PdfEditor';

import AnnotationList from './AnnotationList';
import PdfView from './PdfView';
import BodyEditor from './BodyEditor';
import { useContext } from '../context';

enum Panel {
  Body = 'body',
  Pdf = 'pdf',
  Annotation = 'annotation',
}

export default function PdfEditorView() {
  const ctx = useContext()!;
  const editor = createMemo(() => {
    assert(ctx.editor instanceof PdfEditor);
    return ctx.editor;
  });

  const panels = createMemo(() => {
    assert(ctx.editor instanceof PdfEditor);
    const totalSize = sum([editor().body, editor().annotation].map(({ width, isEnabled }) => (isEnabled ? width : 0)));

    const panels = compact([
      ctx.editor.body.isEnabled && { id: Panel.Body, size: ctx.editor.body.width },
      { id: Panel.Pdf, size: 100 - totalSize },
      ctx.editor.annotation.isEnabled && { id: Panel.Annotation, size: ctx.editor.annotation.width },
    ]);

    return {
      panels: panels.map(({ id }) => ({ id })),
      size: panels.map(({ size }) => size),
    };
  });

  function handleResize({ size, resizeTriggerId }: SplitterResizeDetails) {
    if (!resizeTriggerId) {
      return;
    }

    const panelMap = {
      [Panel.Annotation]: editor().annotation,
      [Panel.Body]: editor().body,
    };

    const sizeMap = zipObject(
      panels().panels.map(({ id }) => id),
      size,
    );

    for (const id of resizeTriggerId.split(':')) {
      if (id in panelMap) {
        panelMap[id as keyof typeof panelMap]!.width = sizeMap[id]!;
      }
    }
  }

  return (
    <Splitter.Root {...panels()} class="grow flex min-h-0" onResize={action(handleResize)}>
      <Show when={editor().body.isEnabled}>
        <Splitter.Panel id={Panel.Body}>
          <BodyEditor />
        </Splitter.Panel>
        <Splitter.ResizeTrigger class="w-1" id={`${Panel.Body}:${Panel.Pdf}`} />
      </Show>
      <Splitter.Panel id={Panel.Pdf} asChild={(childProps) => <PdfView {...childProps()} />} />
      <Show when={editor().annotation.isEnabled}>
        <Splitter.ResizeTrigger class="w-1" id={`${Panel.Pdf}:${Panel.Annotation}`} />
        <Splitter.Panel id={Panel.Annotation} asChild={(childProps) => <AnnotationList {...childProps()} />} />
      </Show>
    </Splitter.Root>
  );
}
