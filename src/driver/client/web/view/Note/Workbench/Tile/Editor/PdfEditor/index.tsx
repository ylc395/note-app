import { createMemo, createSignal, onCleanup, onMount, Show } from 'solid-js';
import assert from 'assert';

import type PdfEditor from '#domain/client/app/model/note/editor/PdfEditor';
import PDFViewer from './PDFViewer';
import Toolbar from './Toolbar';
import Outline from './OutlineList';
import AnnotationList from './AnnotationList';
import SelectionTooltip from './SelectionTooltip';
import SearchBar from './SearchBar';
import AnnotationLayer from './AnnotationLayer';
import './style.css';

export default function PdfEditorView(props: { editor: PdfEditor }) {
  let containerRef: HTMLDivElement | undefined;
  let viewRef: HTMLDivElement | undefined;
  const [getPdfViewer, setPdfViewer] = createSignal<PDFViewer>();

  const isOutlineVisible = createMemo(() => {
    return props.editor.outline.state.isReady && props.editor.outline.state.get('panelVisible');
  });

  const isAnnotationVisible = createMemo(() => {
    return props.editor.annotation.state.isReady && props.editor.annotation.state.get('panelVisible');
  });

  onMount(() => {
    assert(containerRef && viewRef);

    const viewer = new PDFViewer({
      container: containerRef,
      viewer: viewRef,
      editor: props.editor,
    });

    setPdfViewer(viewer);
    onCleanup(() => viewer.destroy());
  });

  return (
    <div class="grow flex flex-col min-h-0">
      <Show when={getPdfViewer()}>{(viewer) => <Toolbar viewer={viewer()} />}</Show>
      <div class="grow flex min-h-0">
        <Show when={isOutlineVisible() && getPdfViewer()}>{(viewer) => <Outline viewer={viewer()} />}</Show>
        <div class="grow flex flex-col">
          <Show when={getPdfViewer()}>
            {(pdfViewer) => (
              <Show when={pdfViewer().textFinder.model.isEnabled}>
                <SearchBar textFinder={pdfViewer().textFinder} />
              </Show>
            )}
          </Show>
          <div class="relative grow" classList={{ invisible: !getPdfViewer()?.isReady }}>
            <div
              class="absolute inset-0 overflow-auto pdfViewer" /* pdfViewer 这个类名来自 pdf_viewer.css */
              ref={containerRef}
            >
              <div class="select-text" ref={viewRef}></div>
            </div>
            <Show when={getPdfViewer()}>
              {(viewer) => (
                <>
                  <AnnotationLayer pdfViewer={viewer()} />
                  <SelectionTooltip pdfViewer={viewer()} />
                </>
              )}
            </Show>
          </div>
        </div>
        <Show when={isAnnotationVisible() && getPdfViewer()}>
          {(viewer) => <AnnotationList pdfViewer={viewer()} />}
        </Show>
      </div>
    </div>
  );
}
