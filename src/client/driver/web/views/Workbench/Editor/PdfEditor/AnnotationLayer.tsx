import { createPortal } from 'react-dom';
import { observer } from 'mobx-react-lite';

import type PdfViewer from './PdfViewer';
import HighlightFragment from './HighlightFragment';
import DraggingHighlightArea from './DraggingHighlightArea';

export default observer(function AnnotationLayer({ pdfViewer, page }: { pdfViewer: PdfViewer; page: number }) {
  const textLayerEl = pdfViewer.getTextLayerEl(page);

  if (!textLayerEl) {
    return null;
  }

  const fragments = pdfViewer.editor.highlightFragmentsByPage[page] || [];

  return createPortal(
    <div>
      {fragments.map((fragment) => (
        <HighlightFragment key={fragment.highlightId} fragment={fragment} />
      ))}
      <DraggingHighlightArea page={page} pdfViewer={pdfViewer} />
    </div>,
    textLayerEl,
  );
});
