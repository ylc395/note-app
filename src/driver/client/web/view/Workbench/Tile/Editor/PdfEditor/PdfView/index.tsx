import { createEffect, onCleanup, Show } from 'solid-js';

import SearchBar from './SearchBar';
import SvgEditorBar from './SvgEditorBar';
import SelectionTooltip from './SelectionTooltip';
import { ContextProvider } from '../context';
import './style.css';
import { useContext } from '../context';

export default function PdfEditorView(props: Record<string, unknown>) {
  let containerRef: HTMLDivElement | undefined;
  let viewRef: HTMLDivElement | undefined;
  const { viewer: pdfViewer } = useContext()!;

  createEffect(() => {
    pdfViewer.init({
      view: viewRef!,
      container: containerRef!,
    });
  });

  onCleanup(() => {
    pdfViewer.destroy();
  });

  return (
    <ContextProvider viewer={pdfViewer}>
      <div class="grow flex min-h-0 overflow-hidden flex-col" {...props}>
        <Show when={pdfViewer.editor.textFinder.isEnabled}>
          <SearchBar />
        </Show>
        <Show when={pdfViewer.editor.svgEditor.isEnabled}>
          <SvgEditorBar />
        </Show>
        <div
          class="relative grow overflow-hidden"
          classList={{ invisible: !pdfViewer.viewer.isReady }}
          data-drawing-mode={pdfViewer.editor.svgEditor.isEnabled ? pdfViewer.editor.svgEditor.mode : ''}
        >
          <div
            class="absolute inset-0 overflow-auto pdfViewer" /* pdfViewer 这个类名来自 pdf_viewer.css */
            ref={containerRef}
          >
            <div classList={{ 'select-text': !pdfViewer.editor.svgEditor.isEnabled }} ref={viewRef}></div>
            <SelectionTooltip />
          </div>
        </div>
      </div>
    </ContextProvider>
  );
}
