import { createQuery } from 'mobx-tanstack-query/preset';
import { createEffect, createSignal, onCleanup, Show } from 'solid-js';
import { ZoomInIcon, ZoomOutIcon } from 'lucide-solid';

import container from '#utils/singletonContainer';
import PDFDocumentFactory from '#domain/client/app/model/base/PDFDocumentFactory';
import { token as remoteToken } from '#domain/client/shared/infra/rpc';
import PDFViewer, { ScaleValues } from '#web/infra/PDFViewer';

export default function PDFPreviewer(props: { id: string }) {
  const remote = container.resolve(remoteToken);
  const factory = container.resolve(PDFDocumentFactory);

  const [pdfViewer, setPdfViewer] = createSignal<PDFViewer>();
  let containerRef: HTMLDivElement | undefined;
  let viewRef: HTMLDivElement | undefined;

  const file = createQuery(
    ({ signal, queryKey: [_, id] }) => {
      return remote.note.getBlob.query(id, { signal });
    },
    {
      queryKey: ['note.blob', props.id] as const,
    },
  );

  createEffect(() => {
    if (!file.data || !containerRef || !viewRef) {
      return;
    }

    factory.create({ key: props.id, blob: file.data as ArrayBuffer }).then((doc) => {
      const pdfViewer = new PDFViewer();

      pdfViewer
        .init(doc, {
          container: containerRef,
          view: viewRef,
          initialScale: ScaleValues.PageFit,
          disableTextLayer: true,
        })
        .then(() => {
          setPdfViewer(pdfViewer);
        });
    });

    onCleanup(() => {
      factory.revoke(props.id);
    });
  });

  onCleanup(() => {
    pdfViewer()?.destroy();
  });

  return (
    <div
      ref={containerRef}
      class=" bg-red-100 w-64 h-64 overflow-auto absolute pdfViewer" // pdfViewer 这个类名来自 pdf_viewer.css
    >
      <Show when={pdfViewer()}>
        {(viewer) => (
          <div class="sticky flex w-fit top-0 left-0 z-10">
            <button onClick={() => viewer().setScale('up')}>
              <ZoomInIcon />
            </button>
            <button onClick={() => viewer().setScale('down')}>
              <ZoomOutIcon />
            </button>
            <span>{pdfViewer()?.currentPage}</span>
          </div>
        )}
      </Show>
      <div ref={viewRef}></div>
    </div>
  );
}
