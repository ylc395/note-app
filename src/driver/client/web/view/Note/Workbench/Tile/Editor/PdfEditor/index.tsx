import { onCleanup, onMount } from 'solid-js';
import assert from 'assert';

import type PdfEditor from '#domain/client/app/model/note/editor/PdfEditor';
import PDFViewer from './PDFViewer';
import './style.css';

export default function PdfEditorView(props: { editor: PdfEditor }) {
  let containerRef: HTMLDivElement | undefined;
  let viewRef: HTMLDivElement | undefined;

  onMount(() => {
    assert(containerRef && viewRef);

    const viewer = new PDFViewer({
      container: containerRef,
      viewer: viewRef,
      editor: props.editor,
    });

    onCleanup(() => viewer.destroy());
  });

  return (
    <div class="relative grow overflow-hidden">
      <div class="absolute inset-0 overflow-auto" ref={containerRef}>
        <div ref={viewRef}></div>
      </div>
    </div>
  );
}
