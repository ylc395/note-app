import { createEffect, createMemo, Show } from 'solid-js';
import { Splitter, type SplitterResizeDetails } from '@ark-ui/solid';
import { action } from 'mobx';
import { compact, sum, zipObject } from 'lodash-es';
import assert from 'assert';

import PdfEditor from '#domain/client/app/model/note/editor/PdfEditor';

import AnnotationList from './AnnotationList';
import PdfView from './PdfView';
import BodyEditor from './BodyEditor';
import Toolbar from './Toolbar';
import PDFEditorViewer from './PDFEditorViewer';
import OutlineList from './OutlineList';

import { ContextProvider } from './context';
import { useContext } from '../context';

enum Panel {
  Body = 'body',
  Outline = 'outline',
  Pdf = 'pdf',
  Annotation = 'annotation',
}

function isStatic(state: { isEnabled?: boolean; floatingPos?: unknown }) {
  return Boolean(state.isEnabled && !state.floatingPos);
}

export default function PdfEditorView() {
  const ctx = useContext()!;
  const editor = createMemo(() => {
    assert(ctx.editor instanceof PdfEditor);
    return ctx.editor;
  });

  const pdfViewer = new PDFEditorViewer(editor());

  const panels = createMemo(() => {
    assert(ctx.editor instanceof PdfEditor);

    const panels = compact([
      isStatic(ctx.editor.body.uiState) && { id: Panel.Body, size: ctx.editor.body.uiState.width ?? 20 },
      isStatic(ctx.editor.outline.uiState) && { id: Panel.Outline, size: ctx.editor.outline.uiState.width ?? 20 },
      { id: Panel.Pdf },
      isStatic(ctx.editor.annotation.uiState) && {
        id: Panel.Annotation,
        size: ctx.editor.annotation.uiState.width ?? 20,
      },
    ]);

    const totalSize = sum(panels.map(({ size }) => size));

    return {
      panels: panels.map(({ id }) => ({ id })),
      size: panels.map(({ size }) => size ?? 100 - totalSize),
    };
  });

  function handleResize({ size, resizeTriggerId }: SplitterResizeDetails) {
    if (!resizeTriggerId) {
      return;
    }

    const panelMap = {
      [Panel.Annotation]: editor().annotation,
      [Panel.Body]: editor().body,
      [Panel.Outline]: editor().outline,
    };

    const sizeMap = zipObject(
      panels().panels.map(({ id }) => id),
      size,
    );

    for (const id of resizeTriggerId.split(':')) {
      if (id in panelMap) {
        panelMap[id as keyof typeof panelMap]!.uiState.width = sizeMap[id]!;
      }
    }
  }

  return (
    <ContextProvider viewer={pdfViewer}>
      <Toolbar />
      <Splitter.Root {...panels()} class="grow flex min-h-0" onResize={action(handleResize)}>
        <Show when={isStatic(editor().body.uiState)}>
          <Splitter.Panel id={Panel.Body}>
            <BodyEditor />
          </Splitter.Panel>
          <Splitter.ResizeTrigger
            class="w-1"
            id={`${Panel.Body}:${isStatic(pdfViewer.editor.outline.uiState) ? Panel.Outline : Panel.Pdf}`}
          />
        </Show>
        <Show when={isStatic(pdfViewer.editor.outline.uiState)}>
          <Splitter.Panel id={Panel.Outline} asChild={(childProps) => <OutlineList {...childProps()} />} />
          <Splitter.ResizeTrigger class="w-1" id={`${Panel.Outline}:${Panel.Pdf}`} />
        </Show>
        <Splitter.Panel id={Panel.Pdf} asChild={(childProps) => <PdfView {...childProps()} />} />
        <Show when={isStatic(editor().annotation.uiState)}>
          <Splitter.ResizeTrigger class="w-1" id={`${Panel.Pdf}:${Panel.Annotation}`} />
          <Splitter.Panel id={Panel.Annotation} asChild={(childProps) => <AnnotationList {...childProps()} />} />
        </Show>
      </Splitter.Root>
    </ContextProvider>
  );
}
