import { createPortal } from 'react-dom';
import { observer } from 'mobx-react-lite';

import type PdfViewer from './PdfViewer';
import HighlightFragment from './HighlightFragment';

export default observer(function AnnotationLayer({ pdfViewer, page }: { pdfViewer: PdfViewer; page: number }) {
  const targetEl = pdfViewer.getTextLayerElement(page);

  if (!targetEl) {
    return null;
  }

  const fragments = pdfViewer.editor.highlightFragmentsByPage[page];

  if (!fragments) {
    return null;
  }

  return createPortal(
    <div>
      {fragments.map((fragment) => (
        <HighlightFragment key={fragment.highlightId} fragment={fragment} />
      ))}
    </div>,
    targetEl,
  );
});
