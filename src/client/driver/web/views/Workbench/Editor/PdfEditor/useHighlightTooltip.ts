import { useCallback, useMemo, useState } from 'react';
import { useDebounceFn, useLatest } from 'ahooks';
import { usePopper } from 'react-popper';
import type { OffsetsFunction } from '@popperjs/core/lib/modifiers/offset';

import type PdfViewer from './PdfViewer';

const isTextNode = (node: Node): node is Text => node.nodeType === document.TEXT_NODE;

const isElement = (node: Node): node is HTMLElement => node.nodeType === document.ELEMENT_NODE;

const isVisible = (node: Node) =>
  isElement(node) ? node === document.body || Boolean(node.offsetParent) : Boolean(node.parentElement?.offsetParent);

const SUSPICIOUS_EMPTY_STRING_REGEX = /^\s{5,}$/;

function getPageFromEndElement(el: HTMLElement | null) {
  let currentEl: HTMLElement | null = el;

  while (currentEl) {
    if (currentEl.dataset.pageNumber) {
      return Number(currentEl.dataset.pageNumber);
    }

    currentEl = currentEl.parentElement;
  }

  return null;
}

function getSelectionEnd(pdfViewer: PdfViewer) {
  const result = pdfViewer.getValidRange();

  if (!result) {
    throw new Error('no range');
  }

  const range = result.range.cloneRange();
  let collapseToStart = result.isEndAtStart;

  // when double click an element to select text, `endOffset` often comes with 0 and `endContainer` is not correct
  // we should find the right endContainer
  if (range.endOffset === 0) {
    const walker = document.createTreeWalker(range.commonAncestorContainer);
    let currentNode: Node | null = walker.currentNode;
    let textNode: Text | undefined | null = null;

    while (currentNode) {
      if (currentNode === range.endContainer) {
        break;
      }

      if (
        range.startContainer === currentNode ||
        range.startContainer.compareDocumentPosition(currentNode) & Node.DOCUMENT_POSITION_FOLLOWING
      ) {
        if (isElement(currentNode) && !isVisible(currentNode)) {
          currentNode = walker.nextSibling();

          if (!currentNode) {
            walker.parentNode();
            currentNode = walker.nextSibling();
          }

          continue;
        }

        if (isTextNode(currentNode) && currentNode.textContent) {
          if (SUSPICIOUS_EMPTY_STRING_REGEX.test(currentNode.textContent)) {
            break;
          }

          if (currentNode.textContent.length > 0) {
            textNode = currentNode;
          }
        }
      }

      currentNode = walker.nextNode();
    }

    if (textNode) {
      range.setEndAfter(textNode);
    } else {
      range.setEndBefore(range.endContainer);
    }
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
      setSelectionEnd(selectionEnd);

      if (popperElement) {
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

  const page = useMemo(() => getPageFromEndElement(selectionEnd?.el || null), [selectionEnd]);

  return { setPopperElement, page, hide, styles, attributes, show };
}
