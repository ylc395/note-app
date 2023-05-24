import { useCallback, useMemo, useState } from 'react';
import { useDebounceFn, useLatest } from 'ahooks';
import { usePopper } from 'react-popper';
import type { OffsetsFunction } from '@popperjs/core/lib/modifiers/offset';

import type PdfViewer from './PdfViewer';
import { isTextNode, getValidEndContainer } from './domUtils';

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

export default function (pdfViewer: PdfViewer | null) {
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<{ el: HTMLElement; collapseToStart: boolean } | null>(null);

  const offsetFn = useCallback<OffsetsFunction>(
    ({ popper, reference }) => {
      if (!selectionEnd) {
        throw new Error('no selectionEnd');
      }

      return [
        popper.x,
        popper.y + (selectionEnd.collapseToStart ? -reference.height - popper.height * 2 : reference.height / 2),
      ];
    },
    [selectionEnd],
  );

  const popperOptions = useMemo(
    () =>
      ({
        placement: 'bottom',
        modifiers: [{ name: 'offset', options: { offset: offsetFn } }],
      } as const),
    [offsetFn],
  );

  const { styles, attributes } = usePopper(selectionEnd?.el, popperElement, popperOptions);

  const show = useDebounceFn(
    () => {
      if (!pdfViewer) {
        throw new Error('no pdfViewer');
      }

      const selectionEnd = getSelectionEnd(pdfViewer);

      if (!selectionEnd) {
        return;
      }

      if (popperElement) {
        setSelectionEnd(selectionEnd);
        popperElement.hidden = false;
      }
    },
    { wait: 300 },
  );

  const hide = useLatest(() => {
    if (popperElement) {
      popperElement.hidden = true;
    }

    if (selectionEnd) {
      selectionEnd.el.remove();
      setSelectionEnd(null);
    }
  });

  return { setPopperElement, hide, styles, attributes, show };
}
