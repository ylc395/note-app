import { createMemo, For } from 'solid-js';
import type PdfViewer from '../PDFViewer';
import Annotation from './Annotation';

export default function PageAnnotationLayer(props: { page: number; pdfViewer: PdfViewer }) {
  const annotations = createMemo(() => {
    return (
      props.pdfViewer.editor.annotation.items.result.data?.filter(
        ({ selector }) =>
          selector.type === 'PDFTextPositionSelector' &&
          selector.position.startPage >= props.page &&
          selector.position.endPage <= props.page,
      ) || []
    );
  });

  return (
    <For each={annotations()}>
      {(annotation) => <Annotation page={props.page} annotation={annotation} pdfViewer={props.pdfViewer} />}
    </For>
  );
}
