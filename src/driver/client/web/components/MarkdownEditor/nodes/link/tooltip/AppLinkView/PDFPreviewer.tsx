import { createQuery } from 'mobx-tanstack-query/preset';
import { createEffect, onCleanup } from 'solid-js';

import container from '#utils/singletonContainer';
import PDFDocumentFactory from '#domain/client/app/model/base/PDFDocumentFactory';
import { token as remoteToken } from '#domain/client/shared/infra/rpc';
import PDFViewer from '#web/infra/PDFViewer';

export default function PDFPreviewer(props: { id: string }) {
  const remote = container.resolve(remoteToken);
  const factory = container.resolve(PDFDocumentFactory);
  let containerRef: HTMLDivElement | undefined;
  let viewRef: HTMLDivElement | undefined;
  let pdfViewer: PDFViewer | undefined;

  const file = createQuery(
    ({ signal, queryKey: [_, id] }) => {
      return remote.note.getBlob.query(id, { signal });
    },
    {
      queryKey: ['note.blob', props.id] as const,
    },
  );

  createEffect(() => {
    if (!file.data || !containerRef || !viewRef || pdfViewer) {
      return;
    }

    factory.create({ key: props.id, blob: file.data as ArrayBuffer }).then((doc) => {
      pdfViewer = new PDFViewer();

      pdfViewer.init(doc, {
        container: containerRef,
        view: viewRef,
        initialScale: 'page-fit',
        disableTextLayer: true,
      });
    });

    onCleanup(() => {
      factory.revoke(props.id);
    });
  });

  onCleanup(() => {
    pdfViewer?.destroy();
  });

  return (
    <div
      ref={containerRef}
      class=" bg-red-100 w-64 h-64 overflow-auto absolute pdfViewer" // pdfViewer 这个类名来自 pdf_viewer.css
    >
      <div ref={viewRef}></div>
    </div>
  );
}
