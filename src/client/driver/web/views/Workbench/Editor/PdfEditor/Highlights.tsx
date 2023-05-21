import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { observer } from 'mobx-react-lite';

import type PdfViewer from './PdfViewer';
import HighlightFragment from './HighlightFragment';

export default observer(function Highlights({ pdfViewer }: { pdfViewer: PdfViewer }) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    pdfViewer.pagesReady.then(() => setIsReady(true));
  }, [pdfViewer]);

  return isReady ? (
    <>
      {pdfViewer.editor.highlightedPages.map((page) => {
        const targetEl = pdfViewer.getTextLayerElement(page);

        if (!targetEl) {
          return null;
        }

        const fragments = pdfViewer.editor.getHighlightFragmentsOfPage(page);

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
      })}
    </>
  ) : null;
});
