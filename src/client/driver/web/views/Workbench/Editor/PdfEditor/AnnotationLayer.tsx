import { createPortal } from 'react-dom';
import { observer } from 'mobx-react-lite';

import type PdfViewer from './PdfViewer';
import HighlightFragment from './HighlightFragment';
import HighlightArea from './HighlightArea';
import DraggingHighlightArea from './DraggingHighlightArea';

export default observer(function AnnotationLayer({ pdfViewer, page }: { pdfViewer: PdfViewer; page: number }) {
  const textLayerEl = pdfViewer.getTextLayerEl(page);
  const canvas = pdfViewer.getCanvasEl(page);

  if (!textLayerEl || !canvas) {
    return null;
  }

  const fragments = pdfViewer.editor.highlightFragmentsByPage[page] || [];
  const areas = pdfViewer.editor.highlightAreasByPage[page] || [];
  const { width: displayWith, height: displayHeight } = pdfViewer.getSize(page);

  const ratios = {
    horizontal: canvas.width / displayWith,
    vertical: canvas.height / displayHeight,
  };

  return createPortal(
    <div>
      {fragments.map((fragment) => (
        <HighlightFragment key={fragment.highlightId} fragment={fragment} ratios={ratios} />
      ))}
      {areas.map((area) => (
        <HighlightArea key={area.id} area={area} ratios={ratios} />
      ))}
      <DraggingHighlightArea page={page} pdfViewer={pdfViewer} ratios={ratios} />
    </div>,
    textLayerEl,
  );
});
