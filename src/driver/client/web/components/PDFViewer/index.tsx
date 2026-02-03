import clsx from 'clsx';
import { onCleanup, onMount, type JSX } from 'solid-js';
import assert from 'assert';

import PDFViewerModel, { type Options } from './PDFViewerModel';
import './style.css';

export default function PDFViewer(
  props: {
    containerClassName?: string;
    viewClassName?: string;
    children?: JSX.Element;
    onReady?: (pdfViewer: PDFViewerModel) => void;
  } & Options,
) {
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

    props.onReady?.(pdfViewer);

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
      {props.children}
    </div>
  );
}
