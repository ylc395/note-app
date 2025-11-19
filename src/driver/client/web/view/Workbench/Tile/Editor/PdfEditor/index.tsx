import { createMemo, Show } from 'solid-js';
import { Splitter, type SplitterResizeDetails } from '@ark-ui/solid';
import { action } from 'mobx';
import { compact, sum, zipObject } from 'lodash-es';

import PdfEditor from '#domain/client/app/model/note/editor/PdfEditor';
import PdfEditorUIState, { Panel } from '#domain/client/app/model/note/editor/PdfEditor/UIState';

import AnnotationList from './AnnotationList';
import PdfView from './PdfView';
import BodyEditor from './BodyEditor';

export default function PdfEditorView(props: { editor: PdfEditor }) {
  const panels = createMemo(() => {
    if (!props.editor.uiState.isReady) {
      return { panels: [] };
    }

    const sizes = props.editor.uiState.panels;
    const totalSize = sum(Object.values(sizes).map((p) => (p?.isVisible && p.size) ?? 0));

    const panels = compact([
      sizes[Panel.Body]?.isVisible && { id: Panel.Body },
      { id: Panel.Pdf },
      sizes[Panel.Annotation]?.isVisible && { id: Panel.Annotation },
    ]);

    const size = panels.map(({ id }) => (id === Panel.Pdf ? 100 - totalSize : sizes[id]!.size));

    return { panels, size };
  });

  function handleResize({ size, resizeTriggerId }: SplitterResizeDetails) {
    if (!resizeTriggerId) {
      return;
    }

    const currentSizes = props.editor.uiState.panels;
    const sizeMap = zipObject(
      panels().panels.map(({ id }) => id),
      size,
    );

    for (const id of resizeTriggerId.split(':')) {
      if (PdfEditorUIState.isTogglablePanel(id)) {
        currentSizes[id]!.size = sizeMap[id]!;
      }
    }
  }

  return (
    <Show when={props.editor.uiState.isReady}>
      <Splitter.Root
        {...panels()}
        class="grow flex min-h-0"
        onResize={action(handleResize)}
        onResizeEnd={() => props.editor.uiState.save()}
      >
        <Show when={props.editor.uiState.panels[Panel.Body]?.isVisible}>
          <Splitter.Panel id={Panel.Body}>
            <BodyEditor editor={props.editor} />
          </Splitter.Panel>
          <Splitter.ResizeTrigger class="w-1" id={`${Panel.Body}:${Panel.Pdf}`} />
        </Show>
        <Splitter.Panel id={Panel.Pdf} asChild={(childProps) => <PdfView editor={props.editor} {...childProps()} />} />
        <Show when={props.editor.uiState.panels[Panel.Annotation]?.isVisible}>
          <Splitter.ResizeTrigger class="w-1" id={`${Panel.Pdf}:${Panel.Annotation}`} />
          <Splitter.Panel
            id={Panel.Annotation}
            asChild={(childProps) => <AnnotationList editor={props.editor} {...childProps()} />}
          />
        </Show>
      </Splitter.Root>
    </Show>
  );
}
