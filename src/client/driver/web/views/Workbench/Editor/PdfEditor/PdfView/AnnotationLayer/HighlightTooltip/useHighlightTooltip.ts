import last from 'lodash/last';
import { useMemo, useContext } from 'react';
import { useFloating, offset, autoUpdate } from '@floating-ui/react';

import { AnnotationTypes } from 'interface/material';

import context from '../../../Context';
import { BUFFER } from '../constants';

export default function useHighlightTooltip(page: number) {
  const { hoveringAnnotationId: annotationId, pdfViewer } = useContext(context);

  const markEl = useMemo(() => {
    if (annotationId && pdfViewer) {
      const annotation = pdfViewer.editor.getAnnotationById(annotationId);

      if (annotation.type === AnnotationTypes.PdfRange) {
        const endPage = Math.max(...annotation.fragments.map(({ page }) => page));
        return endPage === page
          ? last(pdfViewer.getPageEl(page)?.querySelectorAll(`[data-annotation-id="${annotationId}"]`))
          : undefined;
      }

      if (annotation.type === AnnotationTypes.PdfArea) {
        return pdfViewer.getPageEl(page)?.querySelector(`[data-annotation-id="${annotationId}"]`);
      }
    }
  }, [annotationId, page, pdfViewer]);

  const OFFSET = 10;
  const {
    floatingStyles: styles,
    refs: { setFloating },
  } = useFloating({
    elements: { reference: markEl },
    whileElementsMounted: autoUpdate,
    middleware: [offset(OFFSET - BUFFER)],
  });

  return { setFloating, showing: Boolean(markEl), styles };
}
