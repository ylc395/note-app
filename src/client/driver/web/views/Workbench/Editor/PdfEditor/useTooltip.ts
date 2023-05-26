import { useCallback, useMemo, useState } from 'react';
import { useDebounceFn, useLatest } from 'ahooks';
import { usePopper } from 'react-popper';
import type { OffsetsFunction } from '@popperjs/core/lib/modifiers/offset';

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
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<{ el: HTMLElement; collapseToStart: boolean } | null>(null);
  const [showing, setShowing] = useState(false);

  // hide popper before init
  if (!selectionEnd && popperElement) {
    popperElement.style.visibility = 'hidden';
  }

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
      popperElement!.style.visibility = 'visible';
    },
    { wait: 300 },
  );

  const create = useCallback(() => {
    setShowing(true);
    init.run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [init.run]);

  const destroy = useLatest(() => {
    setShowing(false);
    selectionEnd?.el.remove();
    setSelectionEnd(null);
    init.cancel();
  });

  return { setPopperElement, styles, attributes, create, destroy: destroy.current, showing };
}

export function useHighlightTooltip(
  pdfViewer: PdfViewer | null,
  annotation: { id: AnnotationVO['id']; el: HTMLElement } | null,
) {
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(null);
  const { styles, attributes } = usePopper(annotation?.el, popperElement);

  return { setPopperElement, showing: Boolean(annotation), styles, attributes };
}
