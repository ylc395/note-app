import { createMemo, Show } from 'solid-js';
import { Splitter, type SplitterResizeDetails } from '@ark-ui/solid';
import { action } from 'mobx';
import { compact, sum, zipObject } from 'lodash-es';

import PdfEditor, { Panel } from '#domain/client/app/model/note/editor/PdfEditor';

import AnnotationList from './AnnotationList';
import PdfView from './PdfView';
import BodyEditor from './BodyEditor';

export default function PdfEditorView(props: { editor: PdfEditor }) {
  const { body, annotation } = props.editor;
  const panelMap = {
    [Panel.Annotation]: props.editor.annotation,
    [Panel.Body]: props.editor.body,
  };

  const panels = createMemo(() => {
    const totalSize = sum([body, annotation].map(({ width, isEnabled }) => (isEnabled ? width : 0)));

    const panels = compact([
      body.isEnabled && { id: Panel.Body, size: body.width },
      { id: Panel.Pdf, size: 100 - totalSize },
      annotation.isEnabled && { id: Panel.Annotation, size: annotation.width },
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

    const sizeMap = zipObject(
      panels().panels.map(({ id }) => id),
      size,
    );

    for (const id of resizeTriggerId.split(':')) {
      if (id in panelMap) {
        panelMap[id as keyof typeof panelMap].width = sizeMap[id]!;
      }
    }
  }

  return (
    <Splitter.Root {...panels()} class="grow flex min-h-0" onResize={action(handleResize)}>
      <Show when={props.editor.body.isEnabled}>
        <Splitter.Panel id={Panel.Body}>
          <BodyEditor editor={props.editor} />
        </Splitter.Panel>
        <Splitter.ResizeTrigger class="w-1" id={`${Panel.Body}:${Panel.Pdf}`} />
      </Show>
      <Splitter.Panel id={Panel.Pdf} asChild={(childProps) => <PdfView editor={props.editor} {...childProps()} />} />
      <Show when={props.editor.annotation.isEnabled}>
        <Splitter.ResizeTrigger class="w-1" id={`${Panel.Pdf}:${Panel.Annotation}`} />
        <Splitter.Panel
          id={Panel.Annotation}
          asChild={(childProps) => <AnnotationList editor={props.editor} {...childProps()} />}
        />
      </Show>
    </Splitter.Root>
  );
}
