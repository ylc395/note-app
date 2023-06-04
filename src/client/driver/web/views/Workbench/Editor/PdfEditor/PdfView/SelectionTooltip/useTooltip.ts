import { useCallback, useState } from 'react';
import { useDebounceFn, useLatest } from 'ahooks';
import { useFloating, offset, autoUpdate } from '@floating-ui/react';
import type PdfViewer from '../../PdfViewer';
import { isTextNode, getValidEndContainer } from '../../domUtils';

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

export default function useSelectionTooltip(pdfViewer: PdfViewer | null) {
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
