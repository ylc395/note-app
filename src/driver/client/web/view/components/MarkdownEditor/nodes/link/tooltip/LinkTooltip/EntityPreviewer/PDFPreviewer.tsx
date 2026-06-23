import { createEffect, createSignal, onCleanup, Show } from 'solid-js';
import { ZoomInIcon, ZoomOutIcon } from 'lucide-solid';
import { noop } from 'lodash-es';

import Button from '#web/view/components/Button';
import container from '#utils/singletonContainer';
import PDFDocumentFactory from '#domain/client/app/model/base/PDFDocumentFactory';
import PDFViewer, { ScaleValues } from '#web/infra/PDFViewer';
import { useContext } from '../context';

export default function PDFPreviewer() {
  const factory = container.resolve(PDFDocumentFactory);
  const { entity } = useContext()!;

  const [pdfViewer, setPdfViewer] = createSignal<PDFViewer>();
  let containerRef: HTMLDivElement | undefined;
  let viewRef: HTMLDivElement | undefined;

  createEffect(() => {
    if (!entity?.blob.data || !entity.value.data || !containerRef || !viewRef) {
      return;
    }

    const { doc, dispose } = factory.create({
      key: entity.value.data.id,
      blob: entity.blob.data,
    });

    doc
      .then((doc) => {
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
      })
      .catch(noop); // doc 加载可能因组件卸载（dispose）而被取消，忽略即可

    onCleanup(dispose);
  });

  onCleanup(() => {
    pdfViewer()?.destroy();
  });

  return (
    <div class="h-64 flex justify-center">
      <div
        ref={containerRef}
        class="absolute size-64 overflow-auto bg-bg-tertiary rounded border border-border-secondary pdfViewer" // pdfViewer 这个类名来自 pdf_viewer.css
      >
        <Show when={pdfViewer()}>
          {(viewer) => (
            <div class="sticky flex items-center gap-0.5 top-0 left-0 z-10 bg-bg-tertiary/90 backdrop-blur-sm px-1 py-0.5 border-b border-border-secondary">
              <Button size="tiny" square onClick={() => viewer().setScale('up')}>
                <ZoomInIcon class="size-3" />
              </Button>
              <Button size="tiny" square onClick={() => viewer().setScale('down')}>
                <ZoomOutIcon class="size-3" />
              </Button>
              <span class="text-xs text-fg-secondary ml-1">
                {pdfViewer()?.currentPage}/{pdfViewer()?.totalPage}
              </span>
            </div>
          )}
        </Show>
        <div ref={viewRef}></div>
      </div>
    </div>
  );
}
