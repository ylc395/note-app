import { useCallback, useState } from 'react';
import { useDebounceFn, useLatest } from 'ahooks';
import { useFloating, offset } from '@floating-ui/react';

import type PdfViewer from './PdfViewer';
import { isTextNode, getValidEndContainer } from './domUtils';
import type { AnnotationVO } from 'interface/material';

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
  const [showing, setShowing] = useState(false);

  const {
    floatingStyles: styles,
    refs: { setFloating, floating },
  } = useFloating({
    elements: { reference: selectionEnd?.el },
    placement: selectionEnd?.collapseToStart ? 'top' : 'bottom',
    middleware: [offset(10)],
  });

  // hide popper before init
  if (!selectionEnd && floating.current) {
    floating.current.style.visibility = 'hidden';
  }

  const init = useDebounceFn(
    () => {
      if (!pdfViewer) {
        throw new Error('no pdfViewer');
      }

      const selectionEnd = getSelectionEnd(pdfViewer);

      if (!selectionEnd) {
        return;
      }

      setSelectionEnd(selectionEnd);
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      floating.current!.style.visibility = 'visible';
    },
    { wait: 300 },
  );

  const create = useCallback(() => {
    setShowing(true);
    init.run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [init.run]);

  const _destroy = useLatest(() => {
    setShowing(false);
    selectionEnd?.el.remove();
    setSelectionEnd(null);
    init.cancel();
  });

  const destroy = useCallback(() => _destroy.current(), [_destroy]);

  return { setFloating, styles, create, destroy, showing };
}

export function useHighlightTooltip(pdfViewer: PdfViewer | null, annotationEl: HTMLElement | null) {
  const {
    floatingStyles: styles,
    refs: { setFloating },
  } = useFloating({ elements: { reference: annotationEl } });

  return { setFloating, showing: Boolean(annotationEl), styles };
}
