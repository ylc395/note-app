import clsx from 'clsx';
import { onCleanup, onMount } from 'solid-js';
import assert from 'assert';

import PDFViewerModel, { type Options } from './PDFViewer';
import './style.css';

export default function PDFViewer(props: { containerClassName?: string; viewClassName?: string } & Options) {
  let containerRef: HTMLDivElement | undefined;
  let viewRef: HTMLDivElement | undefined;

  onMount(() => {
    assert(containerRef && viewRef);

    const pdfViewer = new PDFViewerModel({
      container: containerRef,
      view: viewRef,
      doc: props.doc,
      initialProgress: props.initialProgress,
      initialScale: props.initialScale,
      onProgressUpdated: props.onProgressUpdated,
    });

    onCleanup(() => {
      pdfViewer.destroy();
    });
  });

  return (
    <div
      ref={containerRef}
      class={clsx(
        props.containerClassName,
        'absolute pdfViewer', // pdfViewer 这个类名来自 pdf_viewer.css
      )}
    >
      <div ref={viewRef} class={props.viewClassName}></div>
    </div>
  );
}
