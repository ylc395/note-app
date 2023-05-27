import { useCallback, useMemo, useState, useContext } from 'react';
import { useDebounceFn, useLatest } from 'ahooks';
import { useFloating, offset, autoUpdate } from '@floating-ui/react';
import last from 'lodash/last';

import { AnnotationTypes } from 'interface/material';
import type PdfViewer from './PdfViewer';
import { isTextNode, getValidEndContainer } from './domUtils';
import context from './Context';
import { BUFFER } from './AnnotationLayer/HighlightFragment';

function getSelectionEnd(pdfViewer: PdfViewer) {
  const result = pdfViewer.getSelectionRange();

  if (!result) {
    return;
  }

  const range = result.range.cloneRange();
  let collapseToStart = result.isEndAtStart;
  const endContainer = getValidEndContainer(range);

  if (isTextNode(endContainer) && range.endContainer !== endContainer) {
    range.setEndAfter(endContainer);
    collapseToStart = false;
  }

  const tmpEl = document.createElement('span');

  range.collapse(collapseToStart);
  range.insertNode(tmpEl);
  tmpEl.style.height = '1em';

  if (__ENV__ === 'dev') {
    tmpEl.className = 'selection-end-mark';
  }

  return { el: tmpEl, collapseToStart };
}

export function useSelectionTooltip(pdfViewer: PdfViewer | null) {
  const [selectionEnd, setSelectionEnd] = useState<{ el: HTMLElement; collapseToStart: boolean } | null>(null);

  const {
    floatingStyles: styles,
    refs: { setFloating },
  } = useFloating({
    elements: { reference: selectionEnd?.el },
    placement: selectionEnd?.collapseToStart ? 'top' : 'bottom',
    middleware: [offset(10)],
    whileElementsMounted: autoUpdate,
  });

  const { run: create, cancel: stopCreating } = useDebounceFn(
    () => {
      if (!pdfViewer) {
        return;
      }

      const selectionEnd = getSelectionEnd(pdfViewer);

      if (selectionEnd) {
        setSelectionEnd(selectionEnd);
      }
    },
    { wait: 300 },
  );

  const _destroy = useLatest(() => {
    selectionEnd?.el.remove();
    setSelectionEnd(null);
    stopCreating();
  });

  const destroy = useCallback(() => _destroy.current(), [_destroy]);

  return { setFloating, styles, create, destroy, showing: Boolean(selectionEnd) };
}

export function useHighlightTooltip(page: number) {
  const { hoveringAnnotationId: annotationId, pdfViewer } = useContext(context);

  const markEl = useMemo(() => {
    if (annotationId && pdfViewer) {
      const { type, annotation } = pdfViewer.editor.getAnnotationById(annotationId);

      if (type === AnnotationTypes.Highlight) {
        const endPage = Math.max(...annotation.fragments.map(({ page }) => page));
        return endPage === page
          ? last(pdfViewer.getPageEl(page)?.querySelectorAll(`[data-annotation-id="${annotationId}"]`))
          : undefined;
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
