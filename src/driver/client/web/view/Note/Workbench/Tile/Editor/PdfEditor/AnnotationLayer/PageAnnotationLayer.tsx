import { createMemo, For } from 'solid-js';
import { Portal } from 'solid-js/web';
import type PdfViewer from '../PDFViewer';
import Annotation from './Annotation';

export default function PageAnnotationLayer(props: { page: number; pdfViewer: PdfViewer }) {
  const annotations = createMemo(() => {
    return (
      props.pdfViewer.editor.annotation.list?.filter(
        ({ selector, isNative }) =>
          !isNative &&
          selector.type === 'PDFTextPositionSelector' &&
          selector.position.startPage >= props.page &&
          selector.position.endPage <= props.page,
      ) || []
    );
  });

  return (
    <Portal mount={props.pdfViewer.getPageTextLayerElement(props.page).parentElement!}>
      <For each={annotations()}>
        {(annotation) => <Annotation page={props.page} annotation={annotation} pdfViewer={props.pdfViewer} />}
      </For>
    </Portal>
  );
}
