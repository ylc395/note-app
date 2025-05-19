import { createSignal, onCleanup, onMount, Show } from 'solid-js';
import assert from 'assert';
import 'pdfjs-dist/web/pdf_viewer.css';

import type PdfEditor from '#domain/client/app/model/note/editor/PdfEditor';
import PDFViewer from './PDFViewer';
import Toolbar from './Toolbar';
import Outline from './OutlineList';
import AnnotationList from './AnnotationList';
import SelectionTooltip from './SelectionTooltip';
import SearchBar from './SearchBar';

export default function PdfEditorView(props: { editor: PdfEditor }) {
  let containerRef: HTMLDivElement | undefined;
  let viewRef: HTMLDivElement | undefined;
  const [getPdfViewer, setPdfViewer] = createSignal<PDFViewer>();

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
        <Show when={props.editor.uiState?.['outline.type'] === 'text' && getPdfViewer()}>
          {(viewer) => <Outline viewer={viewer()} />}
        </Show>
        <div class="grow flex flex-col">
          <Show when={getPdfViewer()}>{(pdfViewer) => <SearchBar pdfViewer={pdfViewer()} />}</Show>
          <div class="relative grow">
            <div
              class="absolute inset-0 overflow-auto pdfViewer" /* pdfViewer 这个类名来自 pdf_viewer.css */
              ref={containerRef}
            >
              <div class="select-text" ref={viewRef}></div>
            </div>
          </div>
        </div>
        <Show when={props.editor.uiState?.['annotation.panel'] && getPdfViewer()}>
          {(viewer) => <AnnotationList viewer={viewer()} />}
        </Show>
        <Show when={getPdfViewer()}>{(viewer) => <SelectionTooltip selection={viewer().selection} />}</Show>
      </div>
    </div>
  );
}
