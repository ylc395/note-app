import { createPortal } from 'react-dom';
import { observer } from 'mobx-react-lite';

import type PdfViewer from './PdfViewer';
import HighlightFragment from './HighlightFragment';

export default observer(function AnnotationLayers({ pdfViewer }: { pdfViewer: PdfViewer }) {
  return (
    <>
      {pdfViewer.annotationPages.map((page) => {
        const targetEl = pdfViewer.getTextLayerElement(page);

        if (!targetEl) {
          return null;
        }

        const fragments = pdfViewer.editor.highlightFragmentsByPage[page];

        if (!fragments) {
          return null;
        }

        return createPortal(
          <div key={page}>
            {fragments.map((fragment) => (
              <HighlightFragment key={fragment.highlightId} fragment={fragment} />
            ))}
          </div>,
          targetEl,
        );
      })}
    </>
  );
});
